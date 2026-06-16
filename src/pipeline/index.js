import 'dotenv/config'
import supabase from '../supabaseClient.js'
import { getUniqueTickers } from './getUniqueTickers.js'
import { fetchMarketData } from './fetchMarketData.js'
import { fetchNews } from './fetchNews.js'
import { generateScripts } from './generateScripts.js'
import { generateAudio } from './generateAudio.js'
import { deliverBriefs } from './deliverBriefs.js'

// Logs a pipeline stage result to DB for monitoring
async function logStage(stage, status, message, durationMs) {
  await supabase.from('pipeline_logs').insert({
    run_date:    new Date().toISOString().split('T')[0],
    stage,
    status,
    message,
    duration_ms: durationMs
  })
}

// Runs a single stage with timing + error handling
async function runStage(name, fn) {
  const start = Date.now()
  console.log(`\n[pipeline] ▶ Starting stage: ${name}`)

  try {
    const result = await fn()
    const duration = Date.now() - start
    const message = JSON.stringify(result)

    console.log(`[pipeline] ✓ ${name} completed in ${duration}ms — ${message}`)
    await logStage(name, 'success', message, duration)

    return result
  } catch (err) {
    const duration = Date.now() - start

    console.error(`[pipeline] ✗ ${name} failed after ${duration}ms — ${err.message}`)
    await logStage(name, 'failed', err.message, duration)

    throw err  // Re-throw so orchestrator can stop pipeline on critical failure
  }
}

// Main pipeline — call this every night at 3am IST
export async function runPipeline() {
  const runStart = Date.now()
  console.log(`\n${'─'.repeat(50)}`)
  console.log(`[pipeline] BriefCast nightly pipeline starting`)
  console.log(`[pipeline] ${new Date().toISOString()}`)
  console.log(`${'─'.repeat(50)}`)

  try {
    // Stage 1: Get all unique tickers across all user watchlists
    const tickers = await runStage('get_tickers', getUniqueTickers)

    if (!tickers.length) {
      console.log('[pipeline] No tickers found — no active users yet. Exiting.')
      return
    }

    // Stage 2: Fetch market data for all tickers (price, volume, gap%)
    await runStage('market_data', () => fetchMarketData(tickers))

    // Stage 3: Fetch news headlines for all tickers
    await runStage('news', () => fetchNews(tickers))

    // Stage 4: Generate personalised scripts per user
    await runStage('scripts', generateScripts)

    // Stage 5: Convert each script to an MP3 and store it
    await runStage('audio', generateAudio)

    // Stage 6: Deliver each ready brief's audio link over WhatsApp
    await runStage('delivery', deliverBriefs)

    const totalDuration = Math.round((Date.now() - runStart) / 1000)
    console.log(`\n[pipeline] ✅ All stages complete in ${totalDuration}s`)
    console.log(`[pipeline] Data ready for ${tickers.length} tickers`)
    console.log(`[pipeline] Briefs ready for delivery\n`)

  } catch (err) {
    console.error(`\n[pipeline] ❌ Pipeline aborted: ${err.message}`)
    process.exit(1)
  }
}

// Allow running directly: node src/pipeline/index.js
if (process.argv[1].includes('pipeline/index')) {
  runPipeline()
}