import 'dotenv/config'
import axios from 'axios'
import supabase from '../supabaseClient.js'

const SERPER_API_KEY = process.env.SERPER_API_KEY
const SERPER_URL = 'https://google.serper.dev/news'

// Delay helper — avoids hammering Serper rate limits
const delay = ms => new Promise(res => setTimeout(res, ms))

// Fetches top 3 news items for a single ticker from Serper
async function fetchTickerNews(ticker) {
  if (!SERPER_API_KEY) throw new Error('SERPER_API_KEY not set in .env')

  // Query is specific to NSE + India context
  const query = `${ticker} NSE stock news India`

  try {
    const { data } = await axios.post(
      SERPER_URL,
      { q: query, num: 3, gl: 'in', hl: 'en' },
      {
        headers: {
          'X-API-KEY': SERPER_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    )

    const news = (data.news || []).slice(0, 3).map(item => ({
      title:   item.title   || '',
      snippet: item.snippet || '',
      source:  item.source  || '',
      url:     item.link    || ''
    }))

    return { ticker, news, error: null }

  } catch (err) {
    const msg = err.response?.data?.message || err.message
    return { ticker, news: [], error: msg }
  }
}

// Main export — fetches news for all tickers, updates ticker_data rows
export async function fetchNews(tickers) {
  if (!tickers.length) return { success: 0, failed: 0 }

  const today = new Date().toISOString().split('T')[0]

  console.log(`[fetchNews] Fetching news for ${tickers.length} tickers`)

  let successCount = 0
  let failedCount = 0

  for (let i = 0; i < tickers.length; i++) {
    const ticker = tickers[i]

    const { news, error } = await fetchTickerNews(ticker)

    if (error) {
      console.warn(`[fetchNews] ${ticker}: ${error}`)
      failedCount++
    } else {
      // Update the existing ticker_data row with news — market data was already saved
      const { error: dbError } = await supabase
        .from('ticker_data')
        .update({ news })
        .eq('ticker', ticker)
        .eq('date', today)

      if (dbError) {
        console.warn(`[fetchNews] DB update failed for ${ticker}: ${dbError.message}`)
        failedCount++
      } else {
        successCount++
      }
    }

    // 200ms pause between requests — Serper free tier is 2500/month
    // At 400 tickers/night that's ~12,000/month — add delay to stay safe
    if (i < tickers.length - 1) await delay(200)
  }

  console.log(`[fetchNews] Done — ${successCount} success, ${failedCount} failed`)
  return { success: successCount, failed: failedCount }
}
