import supabase from '../supabaseClient.js'

// Returns array of unique NSE ticker strings across ALL active users
// e.g. ['RELIANCE', 'INFY', 'HDFCBANK', 'TCS', ...]
//
// Key insight: 1000 users × 10 stocks each = potentially 10,000 tickers
// but in reality NSE has ~2000 active stocks and traders cluster around
// popular ones — deduplication typically reduces this to ~300-500 unique tickers

export async function getUniqueTickers() {

  const { data, error } = await supabase
    .from('watchlists')
    .select('ticker, profiles!inner(is_active)')
    .eq('profiles.is_active', true)

  // Join watchlists with profiles to only include active users
  // const { data, error } = await supabase
  //   .from('watchlists')
  //   .select('ticker, profiles!inner(is_active)')
  //   .eq('profiles.is_active', true)

  if (error) throw new Error(`getUniqueTickers failed: ${error.message}`)
  if (!data || data.length === 0) return []

  // Deduplicate using Set
  const unique = [...new Set(data.map(row => row.ticker))]

  console.log(`[getUniqueTickers] ${data.length} watchlist rows → ${unique.length} unique tickers`)
  return unique
}
