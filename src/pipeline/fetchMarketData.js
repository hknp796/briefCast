import { execFile } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { fileURLToPath } from 'url'
import supabase from '../supabaseClient.js'

const execFileAsync = promisify(execFile)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const BATCH_SIZE = 50  // yfinance handles ~50 tickers per call comfortably

// Splits an array into chunks of given size
function chunk(arr, size) {
  const chunks = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

// Calls Python script to fetch price data for a batch of tickers
async function fetchBatch(tickers) {
  const scriptPath = path.join(__dirname, 'fetch_prices.py')

  // Locally: set PYTHON_PATH to your venv python in .env
  // On Railway/server: falls back to system python3
  const pythonPath = process.env.PYTHON_PATH || 'python3'

  const { stdout, stderr } = await execFileAsync(pythonPath, [scriptPath, ...tickers], {
    timeout: 60000  // 60s timeout per batch
  })

  if (stderr) console.warn(`[fetchMarketData] Python stderr:`, stderr)

  try {
    return JSON.parse(stdout)
  } catch (err) {
    // Surface what Python actually printed — a bare JSON.parse error alone
    // gives no clue whether the script crashed, printed a traceback, or
    // emitted a value JSON can't represent.
    throw new Error(`unparseable Python output: ${err.message} — got: ${stdout.slice(0, 300)}`)
  }
}

// Main export — fetches data for all tickers and upserts to DB
export async function fetchMarketData(tickers) {
  if (!tickers.length) return { success: 0, failed: 0 }

  const today = new Date().toISOString().split('T')[0]
  const batches = chunk(tickers, BATCH_SIZE)

  console.log(`[fetchMarketData] ${tickers.length} tickers in ${batches.length} batches`)

  let successCount = 0
  let failedCount = 0
  const rows = []

  for (let i = 0; i < batches.length; i++) {
    console.log(`[fetchMarketData] Batch ${i + 1}/${batches.length}`)
    try {
      const results = await fetchBatch(batches[i])

      for (const r of results) {
        if (r.error) {
          console.warn(`[fetchMarketData] ${r.ticker}: ${r.error}`)
          failedCount++
          continue
        }
        rows.push({
          ticker:     r.ticker,
          date:       today,
          prev_close: r.prev_close,
          open:       r.open,
          high:       r.high,
          low:        r.low,
          close:      r.close,
          volume:     r.volume,
          gap_pct:    r.gap_pct,
          fetched_at: new Date().toISOString()
        })
        successCount++
      }
    } catch (err) {
      console.error(`[fetchMarketData] Batch ${i + 1} failed:`, err.message)
      failedCount += batches[i].length
    }
  }

  // Every ticker failed — the Python side is broken (missing deps, bad
  // PYTHON_PATH, network). Throw so the run fails fast instead of continuing
  // to stages 4-6, which would find no ticker data and quietly deliver nothing.
  if (successCount === 0) {
    throw new Error(`all ${tickers.length} tickers failed — see the per-batch errors above (check PYTHON_PATH, yfinance install, or network)`)
  }

  // Upsert all rows in one DB call — on conflict (ticker, date) update prices
  if (rows.length > 0) {
    const { error } = await supabase
      .from('ticker_data')
      .upsert(rows, { onConflict: 'ticker,date' })

    if (error) throw new Error(`DB upsert failed: ${error.message}`)
    console.log(`[fetchMarketData] Saved ${rows.length} rows to ticker_data`)
  }

  return { success: successCount, failed: failedCount }
}
