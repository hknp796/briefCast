import 'dotenv/config'
import { Telegraf } from 'telegraf'
import supabase from '../supabaseClient.js'

// ─────────────────────────────────────────────
// Telegram signup bot — the INBOUND half of the Telegram integration.
//
// deliverBriefs.js is the outbound half (bot → user, sending the morning audio).
// This bot is the inbound half: it lets users sign up and manage their watchlist
// entirely over chat, replacing manual SQL inserts. No web app, no Supabase Auth
// login — the Telegram chat_id is the user's identity.
//
// Runs server-side with the service_role Supabase client (same as the pipeline),
// so RLS is bypassed. Uses long-polling (getUpdates) — no public URL needed.
//
// Setup: create a bot via @BotFather → put its token in TELEGRAM_BOT_TOKEN
// (the same token deliverBriefs.js uses). Then: npm run bot
// ─────────────────────────────────────────────

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('Missing TELEGRAM_BOT_TOKEN in .env — create a bot via @BotFather')
}

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)

// NSE symbols are upper-case letters/digits, with occasional & or - (e.g. M&M,
// BAJAJ-AUTO). We store the BARE symbol (no .NS) — fetch_prices.py adds the suffix.
const TICKER_RE = /^[A-Z0-9&-]{1,20}$/

function normaliseTicker(raw) {
  return (raw || '').trim().toUpperCase().replace(/\.NS$/, '')
}

// ─────────────────────────────────────────────
// Find the profile for this Telegram user, creating it on first contact.
// We keep the profiles.id → auth.users.id FK intact by minting an auth user with
// a synthetic email (a future web app can co-exist on the same identity model).
// Returning users are matched by telegram_chat_id.
// ─────────────────────────────────────────────
async function getOrCreateProfile(ctx) {
  const chatId = String(ctx.chat.id)

  const { data: existing, error: findErr } = await supabase
    .from('profiles')
    .select('id, name, language, brief_time')
    .eq('telegram_chat_id', chatId)
    .maybeSingle()

  if (findErr) throw new Error(`profile lookup failed: ${findErr.message}`)
  if (existing) return existing

  // First contact — mint an auth user to satisfy the FK, then insert the profile.
  const name = [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(' ') || 'there'
  const email = `tg_${chatId}@briefcast.local`

  const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { source: 'telegram', telegram_chat_id: chatId, name }
  })
  if (authErr) throw new Error(`auth user create failed: ${authErr.message}`)

  const { data: profile, error: insErr } = await supabase
    .from('profiles')
    .insert({ id: authUser.user.id, email, name, telegram_chat_id: chatId })
    .select('id, name, language, brief_time')
    .single()
  if (insErr) throw new Error(`profile insert failed: ${insErr.message}`)

  console.log(`[bot] new user ${name} (chat ${chatId}) → profile ${profile.id.slice(0, 8)}`)
  return profile
}

const HELP = [
  'BriefCast commands:',
  '',
  '/add RELIANCE — add a stock to your watchlist',
  '/remove RELIANCE — remove a stock',
  '/list — show your watchlist',
  '/language en|hinglish — set brief language',
  '/time 07:00 — set delivery time (IST)',
  '/help — show this message',
  '',
  'Add the NSE symbol only, no .NS — e.g. /add INFY'
].join('\n')

// ─────────────────────────────────────────────
// /start — register (or greet) the user
// ─────────────────────────────────────────────
bot.start(async (ctx) => {
  const profile = await getOrCreateProfile(ctx)
  await ctx.reply(
    `Good to see you, ${profile.name} 👋\n\n` +
    `I'll send you a ~3-minute audio market brief every morning before the NSE opens.\n\n` +
    `Add the stocks you care about, then you're set.\n\n${HELP}`
  )
})

bot.help((ctx) => ctx.reply(HELP))

// ─────────────────────────────────────────────
// /add <TICKER> — upsert into watchlists (idempotent via the unique constraint)
// ─────────────────────────────────────────────
bot.command('add', async (ctx) => {
  const profile = await getOrCreateProfile(ctx)
  const ticker = normaliseTicker(ctx.message.text.split(/\s+/)[1])

  if (!ticker) return ctx.reply('Usage: /add RELIANCE')
  if (!TICKER_RE.test(ticker)) return ctx.reply(`"${ticker}" doesn't look like an NSE symbol. Try e.g. /add TCS`)

  const { error } = await supabase
    .from('watchlists')
    .upsert({ user_id: profile.id, ticker }, { onConflict: 'user_id,ticker' })
  if (error) throw new Error(`watchlist add failed: ${error.message}`)

  await ctx.reply(`✅ Added ${ticker} to your watchlist.`)
})

// ─────────────────────────────────────────────
// /remove <TICKER>
// ─────────────────────────────────────────────
bot.command('remove', async (ctx) => {
  const profile = await getOrCreateProfile(ctx)
  const ticker = normaliseTicker(ctx.message.text.split(/\s+/)[1])

  if (!ticker) return ctx.reply('Usage: /remove RELIANCE')

  const { data, error } = await supabase
    .from('watchlists')
    .delete()
    .eq('user_id', profile.id)
    .eq('ticker', ticker)
    .select('ticker')
  if (error) throw new Error(`watchlist remove failed: ${error.message}`)

  await ctx.reply(data && data.length ? `🗑️ Removed ${ticker}.` : `${ticker} wasn't on your watchlist.`)
})

// ─────────────────────────────────────────────
// /list — show the user's current watchlist
// ─────────────────────────────────────────────
bot.command('list', async (ctx) => {
  const profile = await getOrCreateProfile(ctx)

  const { data, error } = await supabase
    .from('watchlists')
    .select('ticker')
    .eq('user_id', profile.id)
    .order('ticker')
  if (error) throw new Error(`watchlist list failed: ${error.message}`)

  if (!data || data.length === 0) return ctx.reply('Your watchlist is empty. Add a stock with /add RELIANCE')
  await ctx.reply(`Your watchlist (${data.length}):\n` + data.map(r => `• ${r.ticker}`).join('\n'))
})

// ─────────────────────────────────────────────
// /language <en|hinglish>
// ─────────────────────────────────────────────
bot.command('language', async (ctx) => {
  const profile = await getOrCreateProfile(ctx)
  const lang = (ctx.message.text.split(/\s+/)[1] || '').trim().toLowerCase()

  if (lang !== 'en' && lang !== 'hinglish') return ctx.reply('Usage: /language en   (or)   /language hinglish')

  const { error } = await supabase.from('profiles').update({ language: lang }).eq('id', profile.id)
  if (error) throw new Error(`language update failed: ${error.message}`)

  await ctx.reply(`🗣️ Brief language set to ${lang}.`)
})

// ─────────────────────────────────────────────
// /time <HH:MM> — delivery time in IST
// ─────────────────────────────────────────────
bot.command('time', async (ctx) => {
  const profile = await getOrCreateProfile(ctx)
  const time = (ctx.message.text.split(/\s+/)[1] || '').trim()

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return ctx.reply('Usage: /time 07:00 (24h IST)')

  const { error } = await supabase.from('profiles').update({ brief_time: time }).eq('id', profile.id)
  if (error) throw new Error(`time update failed: ${error.message}`)

  await ctx.reply(`⏰ Delivery time set to ${time} IST.`)
})

// Catch errors per-update so one bad message doesn't crash the bot.
bot.catch((err, ctx) => {
  console.error(`[bot] error handling ${ctx.updateType}: ${err.message}`)
  ctx.reply('Something went wrong on my end — please try again in a moment.').catch(() => {})
})

// ─────────────────────────────────────────────
// Boot — long-polling. Graceful shutdown on signals.
// ─────────────────────────────────────────────
bot.launch(() => console.log('[bot] BriefCast Telegram bot is running (long-polling)'))

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
