import 'dotenv/config'
import { GoogleGenAI } from '@google/genai'
import supabase from '../supabaseClient.js'
import { allowedChatIds, logAllowlist } from './allowlist.js'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

// Gemini 2.5 Flash — free tier gives 1,500 requests/day at no cost.
// More than enough to serve ~1,500 daily briefs before you pay anything.
const MODEL = 'gemini-2.5-flash'

// Free tier is rate-limited (~15 requests/minute). Keep concurrency low
// so you don't hit 429s. Raise this once you're on a paid tier.
const CONCURRENCY = 3

// ─────────────────────────────────────────────
// 1. Fetch all active users with their watchlists
// ─────────────────────────────────────────────
async function getActiveUsersWithWatchlists() {
  let query = supabase
    .from('profiles')
    .select('id, name, language, watchlists(ticker)')
    .eq('is_active', true)

  const allow = allowedChatIds()
  logAllowlist('generateScripts', allow)
  if (allow) query = query.in('telegram_chat_id', allow)

  const { data, error } = await query

  if (error) throw new Error(`getActiveUsers failed: ${error.message}`)

  // Keep only users who actually have tickers on their watchlist
  return (data || [])
    .map(u => ({
      id:       u.id,
      name:     u.name || 'there',
      language: u.language || 'en',
      tickers:  (u.watchlists || []).map(w => w.ticker)
    }))
    .filter(u => u.tickers.length > 0)
}

// ─────────────────────────────────────────────
// 2. Fetch today's cached ticker data for a set of tickers
// ─────────────────────────────────────────────
async function getTickerData(tickers, date) {
  const { data, error } = await supabase
    .from('ticker_data')
    .select('ticker, prev_close, open, close, gap_pct, volume, news')
    .in('ticker', tickers)
    .eq('date', date)

  if (error) throw new Error(`getTickerData failed: ${error.message}`)
  return data || []
}

// ─────────────────────────────────────────────
// 3. Build the prompt for the model from a user's data
// ─────────────────────────────────────────────
function buildUserPrompt(user, tickerData) {
  // Compact the data into a clean, readable block for the model
  const lines = tickerData.map(t => {
    const gap = t.gap_pct >= 0 ? `+${t.gap_pct}%` : `${t.gap_pct}%`
    const headlines = (t.news || [])
      .slice(0, 2)
      .map(n => `    - ${n.title} (${n.source})`)
      .join('\n')
    return `${t.ticker}: prev close ₹${t.prev_close}, opened ₹${t.open} (gap ${gap})\n${headlines || '    - No major news'}`
  }).join('\n\n')

  const langNote = user.language === 'hinglish'
    ? 'Write in Hinglish — natural mix of Hindi and English the way Indian retail traders actually speak. Keep stock names and numbers in English.'
    : 'Write in clear, simple English.'

  return `Here is the overnight market data for ${user.name}'s watchlist:

${lines}

Generate the spoken brief now.

Style: ${langNote}`
}

// ─────────────────────────────────────────────
// 4. The system prompt — defines the anchor's voice and rules
// ─────────────────────────────────────────────
const SYSTEM_PROMPT = `You are the voice of BriefCast — a calm, sharp morning market anchor for Indian retail stock traders. You generate a SPOKEN script that will be read aloud by a text-to-speech voice before the NSE opens at 9:15am.

Rules:
- Target 250-320 words. This must stay under 3 minutes spoken.
- Open with a warm one-line greeting using the trader's name.
- Cover the watchlist stocks: what moved overnight, the gap, and why (use the news).
- Group naturally — don't just read a list. Connect related moves.
- End with ONE "thing to watch today" — a level or event, not a recommendation.
- Plain spoken language. No bullet points, no headers, no symbols, no markdown — this is read aloud.
- Write numbers the way they're spoken: "up one point two percent", not "+1.2%".
- Never tell the user to buy or sell. You inform, you don't advise.
- Close with a brief, natural disclaimer that this is for information only, not financial advice.

Output ONLY the script text. No preamble, no stage directions.`

// ─────────────────────────────────────────────
// 5. Call Gemini to generate one user's script
// ─────────────────────────────────────────────
async function generateScript(user, tickerData) {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: buildUserPrompt(user, tickerData),
    config: {
      systemInstruction: SYSTEM_PROMPT,
      // Gemini 2.5 Flash is a thinking model — reasoning tokens are drawn from
      // maxOutputTokens. Disable thinking (we don't need it for a short brief)
      // so the whole budget goes to the script, and keep generous headroom.
      thinkingConfig: { thinkingBudget: 0 },
      maxOutputTokens: 2048,
      temperature: 0.7
    }
  })

  // If the model still hits the cap mid-script, surface it instead of silently
  // saving a truncated brief.
  const finishReason = response.candidates?.[0]?.finishReason
  if (finishReason === 'MAX_TOKENS') {
    throw new Error('Gemini hit MAX_TOKENS — script truncated')
  }

  const script = (response.text || '').trim()

  if (!script) throw new Error('Gemini returned empty script')
  return script
}

// ─────────────────────────────────────────────
// 6. Save a generated script to the briefs table
// ─────────────────────────────────────────────
async function saveBrief(userId, date, script) {
  const { error } = await supabase
    .from('briefs')
    .upsert(
      { user_id: userId, date, script, status: 'pending', delivered: false },
      { onConflict: 'user_id,date' }
    )

  if (error) throw new Error(`saveBrief failed: ${error.message}`)
}

// ─────────────────────────────────────────────
// 7. Process a single user end to end
// ─────────────────────────────────────────────
async function processUser(user, date) {
  const tickerData = await getTickerData(user.tickers, date)

  if (tickerData.length === 0) {
    console.warn(`[generateScripts] ${user.id}: no ticker data found, skipping`)
    return { ok: false }
  }

  const script = await generateScript(user, tickerData)
  await saveBrief(user.id, date, script)

  console.log(`[generateScripts] ✓ ${user.name} (${user.id.slice(0, 8)}) — ${script.split(' ').length} words`)
  return { ok: true }
}

// ─────────────────────────────────────────────
// 8. Simple concurrency pool — process N users at a time
// ─────────────────────────────────────────────
async function runPool(users, date, limit) {
  let index = 0
  let success = 0
  let failed = 0

  async function worker() {
    while (index < users.length) {
      const user = users[index++]
      try {
        const res = await processUser(user, date)
        res.ok ? success++ : failed++
      } catch (err) {
        console.error(`[generateScripts] ✗ ${user.id.slice(0, 8)}: ${err.message}`)
        failed++
      }
    }
  }

  // Launch `limit` workers that pull from the shared queue
  await Promise.all(Array.from({ length: limit }, worker))
  return { success, failed }
}

// ─────────────────────────────────────────────
// Main export — called by the pipeline after data is ready
// ─────────────────────────────────────────────
export async function generateScripts() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not set in .env')
  }

  const date = new Date().toISOString().split('T')[0]
  const users = await getActiveUsersWithWatchlists()

  console.log(`[generateScripts] Generating scripts for ${users.length} users`)

  if (users.length === 0) return { success: 0, failed: 0 }

  const result = await runPool(users, date, CONCURRENCY)
  console.log(`[generateScripts] Done — ${result.success} success, ${result.failed} failed`)
  return result
}

// Allow running directly for testing: node src/pipeline/generateScripts.js
if (process.argv[1].includes('generateScripts')) {
  generateScripts().then(() => process.exit(0))
}