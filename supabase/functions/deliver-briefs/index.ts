// ─────────────────────────────────────────────
// BriefCast delivery — honours each user's /time (profiles.brief_time).
//
// Supabase Edge Function (Deno), invoked EVERY MINUTE by pg_cron + pg_net
// (see supabase/cron.sql). It only SENDS briefs — the nightly pipeline
// (GitHub Actions, 3am IST) generates them. Each run delivers every ready,
// undelivered brief whose owner's brief_time has arrived, so a brief lands
// within ~1 minute of the time the user set.
//
// Same logic as src/pipeline/deliverBriefs.js (stage 6 of the pipeline, which
// still runs once right after generation). Both claim a brief
// (delivered false → true) before sending, so they never double-send.
//
// Auth: pg_cron sends an `x-cron-secret` header matching DELIVER_CRON_SECRET.
// verify_jwt is off in config.toml because of this.
//
// Deploy:
//   npx supabase secrets set DELIVER_CRON_SECRET=$(openssl rand -hex 32)
//   npx supabase functions deploy deliver-briefs
// ─────────────────────────────────────────────

import { createClient } from 'npm:@supabase/supabase-js@2'

const TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
const CRON_SECRET = Deno.env.get('DELIVER_CRON_SECRET')

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_KEY')!,
  { auth: { persistSession: false } }
)

// Telegram allows ~30 msgs/sec to different users; stay well clear.
const CONCURRENCY = 5

interface Brief {
  user_id: string
  date: string
  audio_url: string | null
  profiles: { telegram_chat_id: string | null; name: string | null; brief_time: string | null } | null
}

// Current wall-clock time in IST as 'HH:MM' — same format as profiles.brief_time
// (the bot enforces zero-padded 24h), so the two compare correctly as strings.
function nowIST(): string {
  return new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(11, 16)
}

// Ready, undelivered briefs whose owner's time has passed. Window is
// yesterday-or-later (UTC): the 3am IST run is 21:30 UTC, so its briefs carry
// the PREVIOUS UTC date. Only the newest brief per user is sent.
async function getDeliverableBriefs(sinceDate: string, now: string): Promise<Brief[]> {
  const { data, error } = await supabase
    .from('briefs')
    .select('user_id, date, audio_url, profiles(telegram_chat_id, name, brief_time)')
    .gte('date', sinceDate)
    .eq('status', 'ready')
    .eq('delivered', false)
    .order('date', { ascending: false })

  if (error) throw new Error(`getDeliverableBriefs failed: ${error.message}`)

  const seen = new Set<string>()
  return ((data ?? []) as unknown as Brief[]).filter((b) => {
    if (seen.has(b.user_id)) return false
    seen.add(b.user_id)
    return (b.profiles?.brief_time || '07:00') <= now
  })
}

async function sendTelegramAudio(chatId: string, name: string, audioUrl: string) {
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendAudio`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      audio: audioUrl,
      title: 'BriefCast — Market Brief',
      performer: 'BriefCast',
      caption: `Good morning ${name} ☀️ Your market brief is ready.`,
    }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.description ?? `Telegram HTTP ${res.status}`)
  }
}

// Claim (delivered=true only if still false) or release (delivered=false).
async function setDelivered(userId: string, date: string, delivered: boolean): Promise<boolean> {
  let query = supabase.from('briefs').update({ delivered }).eq('user_id', userId).eq('date', date)
  if (delivered) query = query.eq('delivered', false)

  const { data, error } = await query.select('user_id')
  if (error) throw new Error(`setDelivered failed: ${error.message}`)
  return (data ?? []).length > 0
}

async function processBrief(brief: Brief): Promise<boolean> {
  const { user_id, date, audio_url } = brief
  const name = brief.profiles?.name || 'there'
  const chatId = brief.profiles?.telegram_chat_id

  if (!chatId || !audio_url) {
    console.warn(`[deliver-briefs] ${user_id.slice(0, 8)}: missing ${!chatId ? 'telegram_chat_id' : 'audio_url'}, skipping`)
    return false
  }

  if (!(await setDelivered(user_id, date, true))) return true // another run sent it

  try {
    await sendTelegramAudio(chatId, name, audio_url)
  } catch (err) {
    await setDelivered(user_id, date, false) // release the claim so the next run retries
    throw err
  }

  console.log(`[deliver-briefs] ✓ ${name} (${user_id.slice(0, 8)}) — sent to chat ${chatId}`)
  return true
}

async function runPool(briefs: Brief[], limit: number) {
  let index = 0
  let success = 0
  let failed = 0

  async function worker() {
    while (index < briefs.length) {
      const brief = briefs[index++]
      try {
        (await processBrief(brief)) ? success++ : failed++
      } catch (err) {
        console.error(`[deliver-briefs] ✗ ${brief.user_id.slice(0, 8)}: ${(err as Error).message}`)
        failed++
      }
    }
  }

  await Promise.all(Array.from({ length: limit }, worker))
  return { success, failed }
}

Deno.serve(async (req) => {
  if (!CRON_SECRET || req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return new Response('unauthorized', { status: 401 })
  }
  if (!TOKEN) {
    console.log('[deliver-briefs] TELEGRAM_BOT_TOKEN not set — skipping')
    return Response.json({ skipped: true })
  }

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const now = nowIST()
    const briefs = await getDeliverableBriefs(since, now)
    if (briefs.length === 0) return Response.json({ now, success: 0, failed: 0 })

    console.log(`[deliver-briefs] ${now} IST — delivering ${briefs.length} briefs due by now`)
    const result = await runPool(briefs, CONCURRENCY)
    console.log(`[deliver-briefs] Done — ${result.success} sent, ${result.failed} failed`)
    return Response.json({ now, ...result })
  } catch (err) {
    console.error(`[deliver-briefs] ${(err as Error).message}`)
    return Response.json({ error: (err as Error).message }, { status: 500 })
  }
})
