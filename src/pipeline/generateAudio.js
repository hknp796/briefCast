import 'dotenv/config'
import { GoogleGenAI } from '@google/genai'
import { Mp3Encoder } from '@breezystack/lamejs'
import supabase from '../supabaseClient.js'

// ─────────────────────────────────────────────
// TTS provider. Gemini is the default: it reuses GEMINI_API_KEY (already used
// for scripts), runs on the free tier, and handles Hinglish. ElevenLabs is kept
// as a fallback — set TTS_PROVIDER=elevenlabs — but its free tier is only
// ~10k chars/month (~6 briefs), which is what silently broke audio in Nov 2026.
// ─────────────────────────────────────────────
const PROVIDER = (process.env.TTS_PROVIDER || 'gemini').toLowerCase()

// gemini-3.8-flash-tts: GA (not preview), ~30s for a full brief. The voice is
// one of Gemini's prebuilt voices (Kore, Charon, Puck, Aoede, ...).
const GEMINI_TTS_MODEL = process.env.GEMINI_TTS_MODEL || 'gemini-3.8-flash-tts'
const GEMINI_TTS_VOICE = process.env.GEMINI_TTS_VOICE || 'Kore'

// Gemini TTS takes a natural-language style direction ahead of the text. It
// shapes delivery only — the instruction itself is not read out.
const GEMINI_STYLE =
  'Read this morning market brief aloud in the calm, clear voice of an Indian business news anchor:'

// ElevenLabs fallback settings. "Sarah" is free-tier usable (gotcha 14).
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'
const ELEVENLABS_MODEL = 'eleven_turbo_v2_5'

// 64 kbps mono is plenty for speech: a 2-minute brief is ~900KB.
const MP3_KBPS = 64

// The public Storage bucket must exist — see gotcha #7 in CLAUDE.md.
const BUCKET = 'briefs-audio'

// Free tiers are rate-limited per minute — keep concurrency low.
const CONCURRENCY = 2

// Transient errors (rate limit / overloaded) get retried after these waits.
const RETRY_DELAYS_MS = [15_000, 45_000]

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

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
// 2a. Audio helpers — Gemini returns 16-bit mono PCM, either raw
// (audio/L16;rate=24000) or wrapped in a WAV container (audio/wav),
// depending on the model. Normalise to PCM, then encode MP3 for Telegram.
// ─────────────────────────────────────────────
function decodePcm(buf, mimeType = '') {
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WAVE') {
    let offset = 12
    let fmt = null
    while (offset + 8 <= buf.length) {
      const id = buf.toString('ascii', offset, offset + 4)
      const size = buf.readUInt32LE(offset + 4)
      const body = offset + 8
      if (id === 'fmt ') {
        fmt = {
          channels: buf.readUInt16LE(body + 2),
          sampleRate: buf.readUInt32LE(body + 4),
          bits: buf.readUInt16LE(body + 14)
        }
      } else if (id === 'data') {
        if (!fmt) throw new Error('WAV has no fmt chunk before data')
        if (fmt.channels !== 1 || fmt.bits !== 16) {
          throw new Error(`unsupported WAV: ${fmt.channels}ch ${fmt.bits}-bit`)
        }
        return { pcm: buf.subarray(body, Math.min(body + size, buf.length)), sampleRate: fmt.sampleRate }
      }
      offset = body + size + (size % 2)  // chunks are word-aligned
    }
    throw new Error('WAV has no data chunk')
  }

  const rate = Number((mimeType.match(/rate=(\d+)/) || [])[1]) || 24000
  return { pcm: buf, sampleRate: rate }
}

function encodeMp3(pcm, sampleRate) {
  // Copy into a fresh ArrayBuffer: a Buffer slice may sit at an odd byte
  // offset, which Int16Array can't view directly.
  const samples = new Int16Array(pcm.buffer.slice(pcm.byteOffset, pcm.byteOffset + pcm.length - (pcm.length % 2)))
  const encoder = new Mp3Encoder(1, sampleRate, MP3_KBPS)
  const chunks = []
  for (let i = 0; i < samples.length; i += 1152) {
    const out = encoder.encodeBuffer(samples.subarray(i, i + 1152))
    if (out.length) chunks.push(Buffer.from(out))
  }
  chunks.push(Buffer.from(encoder.flush()))
  return Buffer.concat(chunks)
}

async function withRetry(label, fn) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn()
    } catch (err) {
      const status = err.status ?? err.statusCode
      const transient = status === 429 || status === 500 || status === 503
      if (!transient || attempt >= RETRY_DELAYS_MS.length) throw err
      const wait = RETRY_DELAYS_MS[attempt]
      console.warn(`[generateAudio] ${label}: HTTP ${status}, retrying in ${wait / 1000}s`)
      await new Promise(r => setTimeout(r, wait))
    }
  }
}

// ─────────────────────────────────────────────
// 2b. Convert a script to MP3 bytes — Gemini TTS
// ─────────────────────────────────────────────
async function synthesizeGemini(script, label) {
  const response = await withRetry(label, () => gemini.models.generateContent({
    model: GEMINI_TTS_MODEL,
    contents: [{ parts: [{ text: `${GEMINI_STYLE}\n\n${script}` }] }],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: GEMINI_TTS_VOICE } } }
    }
  }))

  const candidate = response.candidates?.[0]
  const part = candidate?.content?.parts?.find(p => p.inlineData?.data)
  if (!part) throw new Error(`Gemini returned no audio (finishReason=${candidate?.finishReason ?? 'none'})`)

  const raw = Buffer.from(part.inlineData.data, 'base64')
  const { pcm, sampleRate } = decodePcm(raw, part.inlineData.mimeType)
  if (pcm.length === 0) throw new Error('Gemini returned empty audio')
  return encodeMp3(pcm, sampleRate)
}

// ─────────────────────────────────────────────
// 2c. Convert a script to MP3 bytes — ElevenLabs (fallback)
// Imported lazily so the default Gemini path needs no ElevenLabs key.
// ─────────────────────────────────────────────
let eleven = null
async function synthesizeElevenLabs(script) {
  if (!eleven) {
    const { ElevenLabsClient } = await import('@elevenlabs/elevenlabs-js')
    eleven = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY })
  }
  const stream = await eleven.textToSpeech.convert(ELEVENLABS_VOICE_ID, {
    text: script,
    modelId: ELEVENLABS_MODEL,
    outputFormat: 'mp3_44100_128'
  })

  const chunks = []
  for await (const chunk of stream) chunks.push(Buffer.from(chunk))
  const audio = Buffer.concat(chunks)
  if (audio.length === 0) throw new Error('ElevenLabs returned empty audio')
  return audio
}

function synthesize(script, label) {
  return PROVIDER === 'elevenlabs' ? synthesizeElevenLabs(script) : synthesizeGemini(script, label)
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
  const label = user_id.slice(0, 8)

  if (!script || !script.trim()) {
    console.warn(`[generateAudio] ${label}: empty script, skipping`)
    await markFailed(user_id, date)
    return { ok: false }
  }

  const start = Date.now()
  const audio = await synthesize(script, label)
  const audioUrl = await uploadAudio(user_id, date, audio)
  await saveAudioUrl(user_id, date, audioUrl)

  const kb = Math.round(audio.length / 1024)
  const secs = ((Date.now() - start) / 1000).toFixed(1)
  console.log(`[generateAudio] ✓ ${label} — ${kb}KB MP3 in ${secs}s`)
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
  if (PROVIDER === 'elevenlabs') {
    if (!process.env.ELEVENLABS_API_KEY) throw new Error('TTS_PROVIDER=elevenlabs but ELEVENLABS_API_KEY is not set')
  } else if (PROVIDER === 'gemini') {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not set in .env')
  } else {
    throw new Error(`Unknown TTS_PROVIDER "${PROVIDER}" — use gemini or elevenlabs`)
  }

  const date = new Date().toISOString().split('T')[0]
  const briefs = await getPendingBriefs(date)

  const via = PROVIDER === 'gemini' ? `${GEMINI_TTS_MODEL} / ${GEMINI_TTS_VOICE}` : 'elevenlabs'
  console.log(`[generateAudio] Generating audio for ${briefs.length} pending briefs via ${via}`)

  if (briefs.length === 0) return { success: 0, failed: 0 }

  const result = await runPool(briefs, CONCURRENCY)
  console.log(`[generateAudio] Done — ${result.success} success, ${result.failed} failed`)
  return result
}

// Allow running directly for testing: node src/pipeline/generateAudio.js
if (process.argv[1].includes('generateAudio')) {
  generateAudio().then(() => process.exit(0))
}
