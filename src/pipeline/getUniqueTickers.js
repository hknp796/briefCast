import supabase from '../supabaseClient.js'
import { allowedChatIds, logAllowlist } from './allowlist.js'

// Returns array of unique NSE ticker strings across ALL active users
// e.g. ['RELIANCE', 'INFY', 'HDFCBANK', 'TCS', ...]
//
// Key insight: 1000 users × 10 stocks each = potentially 10,000 tickers
// but in reality NSE has ~2000 active stocks and traders cluster around
// popular ones — deduplication typically reduces this to ~300-500 unique tickers

export async function getUniqueTickers() {

  // !inner makes this a real join, so the profiles.* filters below actually
  // exclude rows rather than just nulling the embedded object.
  let query = supabase
    .from('watchlists')
    .select('ticker, profiles!inner(is_active, telegram_chat_id)')
    .eq('profiles.is_active', true)

  const allow = allowedChatIds()
  logAllowlist('getUniqueTickers', allow)
  if (allow) query = query.in('profiles.telegram_chat_id', allow)

  const { data, error } = await query

  if (error) throw new Error(`getUniqueTickers failed: ${error.message}`)
  if (!data || data.length === 0) return []

  // Deduplicate using Set
  const unique = [...new Set(data.map(row => row.ticker))]

  console.log(`[getUniqueTickers] ${data.length} watchlist rows → ${unique.length} unique tickers`)
  return unique
}
