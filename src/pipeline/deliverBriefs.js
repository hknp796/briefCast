import 'dotenv/config'
import axios from 'axios'
import supabase from '../supabaseClient.js'

// ─────────────────────────────────────────────
// Stage 6: Delivery — push each ready brief's audio to the user over Telegram
// and mark it delivered.
//
// Why Telegram over WhatsApp: a 3am business-initiated WhatsApp message must use
// a pre-approved message TEMPLATE (business verification, registered number,
// 24h-window rules, per-conversation billing). Telegram has none of that — a bot
// can message any user who has /start-ed it, for free, and can send the MP3
// itself (not just a link) so the user just taps play.
//
// Setup: create a bot via @BotFather → put its token in TELEGRAM_BOT_TOKEN.
// Each user gets a chat_id by sending /start to the bot; store it on
// profiles.telegram_chat_id.
// ─────────────────────────────────────────────

const API_BASE = 'https://api.telegram.org'

// Telegram allows ~30 msgs/sec to different users; keep concurrency low to stay
// well clear and respect Supabase Storage serving the audio URLs.
const CONCURRENCY = 5

// ─────────────────────────────────────────────
// 1. Fetch today's ready, not-yet-delivered briefs with the recipient's chat_id.
// `delivered=false` makes re-runs idempotent — already-sent briefs are skipped.
// briefs.user_id is an FK to profiles, so the nested select pulls chat_id + name.
// ─────────────────────────────────────────────
async function getDeliverableBriefs(date) {
  const { data, error } = await supabase
    .from('briefs')
    .select('user_id, date, audio_url, profiles(telegram_chat_id, name)')
    .eq('date', date)
    .eq('status', 'ready')
    .eq('delivered', false)

  if (error) throw new Error(`getDeliverableBriefs failed: ${error.message}`)
  return data || []
}

// ─────────────────────────────────────────────
// 2. Send one audio brief via the Telegram Bot API.
// `audio` accepts a public HTTP URL — Telegram fetches and re-hosts it, so we
// pass the Supabase Storage URL directly (no download/upload needed here).
// ─────────────────────────────────────────────
async function sendTelegramAudio(chatId, name, audioUrl) {
  const url = `${API_BASE}/bot${process.env.TELEGRAM_BOT_TOKEN}/sendAudio`

  const payload = {
    chat_id: chatId,
    audio: audioUrl,
    title: 'BriefCast — Market Brief',
    performer: 'BriefCast',
    caption: `Good morning ${name} ☀️ Your market brief is ready.`
  }

  try {
    await axios.post(url, payload, {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    // Telegram returns { ok:false, description } — surface the useful message.
    const apiMsg = err.response?.data?.description
    throw new Error(apiMsg || err.message)
  }
}

// ─────────────────────────────────────────────
// 3. Mark a brief delivered so re-runs don't re-send it
// ─────────────────────────────────────────────
async function markDelivered(userId, date) {
  const { error } = await supabase
    .from('briefs')
    .update({ delivered: true })
    .eq('user_id', userId)
    .eq('date', date)

  if (error) throw new Error(`markDelivered failed: ${error.message}`)
}

// ─────────────────────────────────────────────
// 4. Process a single brief end to end
// ─────────────────────────────────────────────
async function processBrief(brief) {
  const { user_id, date, audio_url } = brief
  const name = brief.profiles?.name || 'there'
  const chatId = brief.profiles?.telegram_chat_id

  if (!chatId) {
    console.warn(`[deliverBriefs] ${user_id.slice(0, 8)}: no telegram_chat_id on profile, skipping`)
    return { ok: false }
  }
  if (!audio_url) {
    console.warn(`[deliverBriefs] ${user_id.slice(0, 8)}: ready brief has no audio_url, skipping`)
    return { ok: false }
  }

  await sendTelegramAudio(chatId, name, audio_url)
  await markDelivered(user_id, date)

  console.log(`[deliverBriefs] ✓ ${name} (${user_id.slice(0, 8)}) — sent to chat ${chatId}`)
  return { ok: true }
}

// ─────────────────────────────────────────────
// 5. Simple concurrency pool — process N briefs at a time
// ─────────────────────────────────────────────
async function runPool(briefs, limit) {
  let index = 0
  let success = 0
  let failed = 0

  async function worker() {
    while (index < briefs.length) {
      const brief = briefs[index++]
      try {
        const res = await processBrief(brief)
        res.ok ? success++ : failed++
      } catch (err) {
        console.error(`[deliverBriefs] ✗ ${brief.user_id.slice(0, 8)}: ${err.message}`)
        failed++
      }
    }
  }

  await Promise.all(Array.from({ length: limit }, worker))
  return { success, failed }
}

// ─────────────────────────────────────────────
// Main export — called by the pipeline after audio is generated
// ─────────────────────────────────────────────
export async function deliverBriefs() {
  // Telegram isn't wired up yet — skip delivery (don't abort the run) until
  // TELEGRAM_BOT_TOKEN is set. Briefs stay status='ready', delivered=false, so
  // they'll be picked up automatically on the next run once configured.
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.log('[deliverBriefs] Telegram not configured (missing TELEGRAM_BOT_TOKEN) — skipping delivery')
    return { skipped: true, success: 0, failed: 0 }
  }

  const date = new Date().toISOString().split('T')[0]
  const briefs = await getDeliverableBriefs(date)

  console.log(`[deliverBriefs] Delivering ${briefs.length} ready briefs`)

  if (briefs.length === 0) return { success: 0, failed: 0 }

  const result = await runPool(briefs, CONCURRENCY)
  console.log(`[deliverBriefs] Done — ${result.success} sent, ${result.failed} failed`)
  return result
}

// Allow running directly for testing: node src/pipeline/deliverBriefs.js
if (process.argv[1].includes('deliverBriefs')) {
  deliverBriefs().then(() => process.exit(0))
}
