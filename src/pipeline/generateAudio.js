import 'dotenv/config'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import supabase from '../supabaseClient.js'

const eleven = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY })

// Default voice is "Sarah" (EXAVITQu4vr4xnSDxMaL) — calm and clear, good for a
// morning anchor. NOTE: the free tier rejects shared "library" voices via the
// API (402 paid_plan_required) — and that includes some default voices like
// Rachel and Aria. Verified free-tier-usable defaults: Sarah, Laura, Roger,
// George, Brian, Lily. Override with ELEVENLABS_VOICE_ID in .env.
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'

// eleven_turbo_v2_5 is the cheapest model (~half the credits of multilingual)
// and is fast — fine for a spoken news brief. It also handles Hinglish well.
const MODEL = 'eleven_turbo_v2_5'

// MP3 keeps file size small for WhatsApp delivery.
const OUTPUT_FORMAT = 'mp3_44100_128'

// The public Storage bucket must exist — see gotcha #7 in CLAUDE.md.
const BUCKET = 'briefs-audio'

// ElevenLabs free/low tiers are heavily rate-limited and audio calls are slow.
// Keep concurrency low to avoid 429s and to stay inside the char quota.
const CONCURRENCY = 2

// ─────────────────────────────────────────────
// 1. Fetch today's briefs that still need audio.
// Includes `failed` rows so a re-run automatically retries briefs whose audio
// errored earlier (e.g. a transient API failure) — otherwise they'd be stuck
// excluded forever. `ready` briefs already have audio and are skipped.
// ─────────────────────────────────────────────
async function getPendingBriefs(date) {
  const { data, error } = await supabase
    .from('briefs')
    .select('user_id, date, script')
    .eq('date', date)
    .in('status', ['pending', 'failed'])

  if (error) throw new Error(`getPendingBriefs failed: ${error.message}`)
  return data || []
}

// ─────────────────────────────────────────────
// 2. Convert a script to MP3 bytes via ElevenLabs
// ─────────────────────────────────────────────
async function synthesize(script) {
  // convert() returns a ReadableStream of audio chunks — collect into a Buffer.
  const stream = await eleven.textToSpeech.convert(VOICE_ID, {
    text: script,
    modelId: MODEL,
    outputFormat: OUTPUT_FORMAT
  })

  const chunks = []
  for await (const chunk of stream) {
    chunks.push(chunk)
  }

  const audio = Buffer.concat(chunks.map(c => Buffer.from(c)))
  if (audio.length === 0) throw new Error('ElevenLabs returned empty audio')
  return audio
}

// ─────────────────────────────────────────────
// 3. Upload the MP3 to Supabase Storage and return its public URL
// ─────────────────────────────────────────────
async function uploadAudio(userId, date, audio) {
  // One object per (user, date). upsert:true so re-running a day overwrites.
  const path = `${date}/${userId}.mp3`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, audio, {
      contentType: 'audio/mpeg',
      upsert: true
    })

  if (uploadError) throw new Error(`upload failed: ${uploadError.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

// ─────────────────────────────────────────────
// 4. Mark a brief ready with its audio URL
// ─────────────────────────────────────────────
async function saveAudioUrl(userId, date, audioUrl) {
  const { error } = await supabase
    .from('briefs')
    .update({ audio_url: audioUrl, status: 'ready' })
    .eq('user_id', userId)
    .eq('date', date)

  if (error) throw new Error(`saveAudioUrl failed: ${error.message}`)
}

// ─────────────────────────────────────────────
// 5. Mark a brief failed so it isn't picked up as deliverable
// ─────────────────────────────────────────────
async function markFailed(userId, date) {
  await supabase
    .from('briefs')
    .update({ status: 'failed' })
    .eq('user_id', userId)
    .eq('date', date)
}

// ─────────────────────────────────────────────
// 6. Process a single brief end to end
// ─────────────────────────────────────────────
async function processBrief(brief) {
  const { user_id, date, script } = brief

  if (!script || !script.trim()) {
    console.warn(`[generateAudio] ${user_id.slice(0, 8)}: empty script, skipping`)
    await markFailed(user_id, date)
    return { ok: false }
  }

  const audio = await synthesize(script)
  const audioUrl = await uploadAudio(user_id, date, audio)
  await saveAudioUrl(user_id, date, audioUrl)

  const kb = Math.round(audio.length / 1024)
  console.log(`[generateAudio] ✓ ${user_id.slice(0, 8)} — ${kb}KB MP3`)
  return { ok: true }
}

// ─────────────────────────────────────────────
// 7. Simple concurrency pool — process N briefs at a time
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
        console.error(`[generateAudio] ✗ ${brief.user_id.slice(0, 8)}: ${err.message}`)
        await markFailed(brief.user_id, brief.date)
        failed++
      }
    }
  }

  await Promise.all(Array.from({ length: limit }, worker))
  return { success, failed }
}

// ─────────────────────────────────────────────
// Main export — called by the pipeline after scripts are generated
// ─────────────────────────────────────────────
export async function generateAudio() {
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY not set in .env')
  }

  const date = new Date().toISOString().split('T')[0]
  const briefs = await getPendingBriefs(date)

  console.log(`[generateAudio] Generating audio for ${briefs.length} pending briefs`)

  if (briefs.length === 0) return { success: 0, failed: 0 }

  const result = await runPool(briefs, CONCURRENCY)
  console.log(`[generateAudio] Done — ${result.success} success, ${result.failed} failed`)
  return result
}

// Allow running directly for testing: node src/pipeline/generateAudio.js
if (process.argv[1].includes('generateAudio')) {
  generateAudio().then(() => process.exit(0))
}
