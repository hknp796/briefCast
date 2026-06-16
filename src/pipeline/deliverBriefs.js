import 'dotenv/config'
import axios from 'axios'
import supabase from '../supabaseClient.js'

// ─────────────────────────────────────────────
// Stage 6: Delivery — send each ready brief's audio link over WhatsApp
// (Meta WhatsApp Cloud API) and mark it delivered.
//
// A 3am push is a BUSINESS-INITIATED message, which Meta requires to be sent as
// an APPROVED message TEMPLATE (free-form text only works inside the 24h customer
// service window). So we send a template with two body parameters:
//   {{1}} = the user's name      {{2}} = the audio link
// Create/approve a template in Meta → WhatsApp Manager whose body matches, e.g.:
//   "Good morning {{1}} ☀️ Your BriefCast market brief is ready: {{2}}"
// then put its name in WHATSAPP_TEMPLATE_NAME.
// ─────────────────────────────────────────────

const API_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0'

// Cloud API throughput is fine, but a fresh/unverified number is capped on
// unique recipients per day. Keep concurrency low to avoid tripping rate limits.
const CONCURRENCY = 5

// ─────────────────────────────────────────────
// 1. Fetch today's ready, not-yet-delivered briefs with the recipient's phone.
// `delivered=false` makes re-runs idempotent — already-sent briefs are skipped.
// briefs.user_id is an FK to profiles, so the nested select pulls phone + name.
// ─────────────────────────────────────────────
async function getDeliverableBriefs(date) {
  const { data, error } = await supabase
    .from('briefs')
    .select('user_id, date, audio_url, profiles(phone, name)')
    .eq('date', date)
    .eq('status', 'ready')
    .eq('delivered', false)

  if (error) throw new Error(`getDeliverableBriefs failed: ${error.message}`)
  return data || []
}

// ─────────────────────────────────────────────
// 2. Normalise a phone number for the Cloud API (digits only, no '+').
// ─────────────────────────────────────────────
function normalisePhone(phone) {
  return (phone || '').replace(/[^\d]/g, '')
}

// ─────────────────────────────────────────────
// 3. Send one template message via the Cloud API
// ─────────────────────────────────────────────
async function sendWhatsApp(to, name, audioUrl) {
  const url = `https://graph.facebook.com/${API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`

  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'template',
    template: {
      name: process.env.WHATSAPP_TEMPLATE_NAME,
      language: { code: process.env.WHATSAPP_TEMPLATE_LANG || 'en' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: name },
            { type: 'text', text: audioUrl }
          ]
        }
      ]
    }
  }

  try {
    await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })
  } catch (err) {
    // Meta returns structured errors — surface the useful message.
    const apiMsg = err.response?.data?.error?.message
    throw new Error(apiMsg || err.message)
  }
}

// ─────────────────────────────────────────────
// 4. Mark a brief delivered so re-runs don't re-send it
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
// 5. Process a single brief end to end
// ─────────────────────────────────────────────
async function processBrief(brief) {
  const { user_id, date, audio_url } = brief
  const name = brief.profiles?.name || 'there'
  const to = normalisePhone(brief.profiles?.phone)

  if (!to) {
    console.warn(`[deliverBriefs] ${user_id.slice(0, 8)}: no phone on profile, skipping`)
    return { ok: false }
  }
  if (!audio_url) {
    console.warn(`[deliverBriefs] ${user_id.slice(0, 8)}: ready brief has no audio_url, skipping`)
    return { ok: false }
  }

  await sendWhatsApp(to, name, audio_url)
  await markDelivered(user_id, date)

  console.log(`[deliverBriefs] ✓ ${name} (${user_id.slice(0, 8)}) — sent to ${to}`)
  return { ok: true }
}

// ─────────────────────────────────────────────
// 6. Simple concurrency pool — process N briefs at a time
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
  // WhatsApp isn't wired up yet — skip delivery (don't abort the run) until the
  // Meta Cloud API env vars are set. Briefs stay status='ready', delivered=false,
  // so they'll be picked up automatically on the next run once configured.
  const required = ['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_TEMPLATE_NAME']
  const missing = required.filter(k => !process.env[k])
  if (missing.length) {
    console.log(`[deliverBriefs] WhatsApp not configured (missing: ${missing.join(', ')}) — skipping delivery`)
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
