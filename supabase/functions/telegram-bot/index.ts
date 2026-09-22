// ─────────────────────────────────────────────
// BriefCast Telegram bot — the INBOUND half of the Telegram integration,
// running as a Supabase Edge Function (Deno).
//
// Ported from the old Node/telegraf bot (deleted — see git history) to Deno/grammY.
// It exists as an Edge Function because the bot is the only part of BriefCast
// that must be reachable all day: hosting it here means nothing to keep awake,
// no ~50s cold start on a sleeping free web service, and no separate host. The
// nightly pipeline runs elsewhere, as a GitHub Actions cron.
//
// deliverBriefs.js remains the outbound half (bot → user, the morning audio)
// and still runs inside the pipeline.
//
// Identity model is unchanged: the Telegram chat_id IS the user. Runs with the
// service_role key, so RLS is bypassed — same as the pipeline.
//
// Deploy:
//   npx supabase functions deploy telegram-bot
//   npx supabase secrets set TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=...
// Then point Telegram at it (see CLAUDE.md → Deployment).
// ─────────────────────────────────────────────

import { Bot, type Context } from 'npm:grammy@1'
import { createClient } from 'npm:@supabase/supabase-js@2'

const TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
if (!TOKEN) throw new Error('Missing TELEGRAM_BOT_TOKEN — set it with `npx supabase secrets set`')

// Telegram echoes this back in a header on every webhook POST. It's the only
// thing stopping anyone who learns the function URL from injecting fake updates.
const WEBHOOK_SECRET = Deno.env.get('TELEGRAM_WEBHOOK_SECRET')

// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically into
// every Edge Function. SUPABASE_SERVICE_KEY is the name the Node pipeline uses;
// accepted here too so one .env works for local `supabase functions serve`.
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SERVICE_KEY')!,
  { auth: { persistSession: false } }
)

const bot = new Bot(TOKEN)

// NSE symbols are upper-case letters/digits, with occasional & or - (e.g. M&M,
// BAJAJ-AUTO). We store the BARE symbol (no .NS) — fetch_prices.py adds the suffix.
const TICKER_RE = /^[A-Z0-9&-]{1,20}$/

function normaliseTicker(raw: string | undefined): string {
  return (raw ?? '').trim().toUpperCase().replace(/\.NS$/, '')
}

// grammY puts everything after the command in ctx.match; the Node version split
// the raw text instead. Same result, one token.
function firstArg(ctx: Context): string {
  return String(ctx.match ?? '').trim().split(/\s+/)[0] ?? ''
}

interface Profile {
  id: string
  name: string
  language: string
  brief_time: string
}

// ─────────────────────────────────────────────
// Find the profile for this Telegram user, creating it on first contact.
// We keep the profiles.id → auth.users.id FK intact by minting an auth user with
// a synthetic email (a future web app can co-exist on the same identity model).
// Returning users are matched by telegram_chat_id.
// ─────────────────────────────────────────────
async function getOrCreateProfile(ctx: Context): Promise<Profile> {
  const chatId = String(ctx.chat!.id)

  const { data: existing, error: findErr } = await supabase
    .from('profiles')
    .select('id, name, language, brief_time')
    .eq('telegram_chat_id', chatId)
    .maybeSingle()

  if (findErr) throw new Error(`profile lookup failed: ${findErr.message}`)
  if (existing) return existing as Profile

  // First contact — mint an auth user to satisfy the FK, then insert the profile.
  const name = [ctx.from?.first_name, ctx.from?.last_name].filter(Boolean).join(' ') || 'there'
  const email = `tg_${chatId}@briefcast.local`

  const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { source: 'telegram', telegram_chat_id: chatId, name }
  })
  if (authErr) throw new Error(`auth user create failed: ${authErr.message}`)

  const { data: profile, error: insErr } = await supabase
    .from('profiles')
    .insert({ id: authUser.user.id, email, name, telegram_chat_id: chatId })
    .select('id, name, language, brief_time')
    .single()
  if (insErr) throw new Error(`profile insert failed: ${insErr.message}`)

  console.log(`[bot] new user ${name} (chat ${chatId}) → profile ${profile.id.slice(0, 8)}`)
  return profile as Profile
}

const HELP = [
  'BriefCast commands:',
  '',
  '/add RELIANCE — add a stock to your watchlist',
  '/remove RELIANCE — remove a stock',
  '/list — show your watchlist',
  '/language en|hinglish — set brief language',
  '/time 07:00 — set delivery time (IST)',
  '/help — show this message',
  '',
  'Add the NSE symbol only, no .NS — e.g. /add INFY'
].join('\n')

// ─────────────────────────────────────────────
// /start — register (or greet) the user
// ─────────────────────────────────────────────
bot.command('start', async (ctx) => {
  const profile = await getOrCreateProfile(ctx)
  await ctx.reply(
    `Good to see you, ${profile.name} 👋\n\n` +
    `I'll send you a ~3-minute audio market brief every morning before the NSE opens.\n\n` +
    `Add the stocks you care about, then you're set.\n\n${HELP}`
  )
})

bot.command('help', (ctx) => ctx.reply(HELP))

// ─────────────────────────────────────────────
// /add <TICKER> — upsert into watchlists (idempotent via the unique constraint)
// ─────────────────────────────────────────────
bot.command('add', async (ctx) => {
  const profile = await getOrCreateProfile(ctx)
  const ticker = normaliseTicker(firstArg(ctx))

  if (!ticker) return await ctx.reply('Usage: /add RELIANCE')
  if (!TICKER_RE.test(ticker)) {
    return await ctx.reply(`"${ticker}" doesn't look like an NSE symbol. Try e.g. /add TCS`)
  }

  const { error } = await supabase
    .from('watchlists')
    .upsert({ user_id: profile.id, ticker }, { onConflict: 'user_id,ticker' })
  if (error) throw new Error(`watchlist add failed: ${error.message}`)

  await ctx.reply(`✅ Added ${ticker} to your watchlist.`)
})

// ─────────────────────────────────────────────
// /remove <TICKER>
// ─────────────────────────────────────────────
bot.command('remove', async (ctx) => {
  const profile = await getOrCreateProfile(ctx)
  const ticker = normaliseTicker(firstArg(ctx))

  if (!ticker) return await ctx.reply('Usage: /remove RELIANCE')

  const { data, error } = await supabase
    .from('watchlists')
    .delete()
    .eq('user_id', profile.id)
    .eq('ticker', ticker)
    .select('ticker')
  if (error) throw new Error(`watchlist remove failed: ${error.message}`)

  await ctx.reply(data && data.length ? `🗑️ Removed ${ticker}.` : `${ticker} wasn't on your watchlist.`)
})

// ─────────────────────────────────────────────
// /list — show the user's current watchlist
// ─────────────────────────────────────────────
bot.command('list', async (ctx) => {
  const profile = await getOrCreateProfile(ctx)

  const { data, error } = await supabase
    .from('watchlists')
    .select('ticker')
    .eq('user_id', profile.id)
    .order('ticker')
  if (error) throw new Error(`watchlist list failed: ${error.message}`)

  if (!data || data.length === 0) {
    return await ctx.reply('Your watchlist is empty. Add a stock with /add RELIANCE')
  }
  await ctx.reply(`Your watchlist (${data.length}):\n` + data.map((r) => `• ${r.ticker}`).join('\n'))
})

// ─────────────────────────────────────────────
// /language <en|hinglish>
// ─────────────────────────────────────────────
bot.command('language', async (ctx) => {
  const profile = await getOrCreateProfile(ctx)
  const lang = firstArg(ctx).toLowerCase()

  if (lang !== 'en' && lang !== 'hinglish') {
    return await ctx.reply('Usage: /language en   (or)   /language hinglish')
  }

  const { error } = await supabase.from('profiles').update({ language: lang }).eq('id', profile.id)
  if (error) throw new Error(`language update failed: ${error.message}`)

  await ctx.reply(`🗣️ Brief language set to ${lang}.`)
})

// ─────────────────────────────────────────────
// /time <HH:MM> — delivery time in IST
// ─────────────────────────────────────────────
bot.command('time', async (ctx) => {
  const profile = await getOrCreateProfile(ctx)
  const time = firstArg(ctx)

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return await ctx.reply('Usage: /time 07:00 (24h IST)')

  const { error } = await supabase.from('profiles').update({ brief_time: time }).eq('id', profile.id)
  if (error) throw new Error(`time update failed: ${error.message}`)

  await ctx.reply(`⏰ Delivery time set to ${time} IST.`)
})

// Catch errors per-update so one bad message doesn't fail the whole invocation.
bot.catch(async (err) => {
  console.error(`[bot] error handling update: ${err.message}`)
  await err.ctx.reply('Something went wrong on my end — please try again in a moment.').catch(() => {})
})

// ─────────────────────────────────────────────
// HTTP entrypoint.
//
// bot.init() fetches getMe once and must run before handleUpdate — grammY only
// does it automatically under bot.start(), which we never call. The instance is
// reused across invocations while the isolate stays warm, so this is one extra
// API call per cold start, not per message.
// ─────────────────────────────────────────────
let initialised: Promise<void> | null = null

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('ok', { status: 200 })

  if (WEBHOOK_SECRET && req.headers.get('x-telegram-bot-api-secret-token') !== WEBHOOK_SECRET) {
    return new Response('unauthorized', { status: 401 })
  }

  try {
    initialised ??= bot.init()
    await initialised

    // Telegram retries any non-200 or slow response, which would replay the
    // command. bot.catch already absorbs per-update failures, so anything
    // reaching the outer catch is a bug — log it, but still answer 200.
    await bot.handleUpdate(await req.json())
  } catch (err) {
    initialised = null   // a failed init must not be cached
    console.error(`[bot] webhook failed: ${err instanceof Error ? err.message : err}`)
  }

  return new Response('ok', { status: 200 })
})
