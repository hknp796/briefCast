import 'dotenv/config'

// ─────────────────────────────────────────────
// Combined production entrypoint — runs BOTH long-running processes in one
// process so BriefCast fits a single Railway service:
//
//   1. the nightly cron scheduler (src/cron.js) — fires the pipeline at 3am IST
//   2. the inbound Telegram signup bot (src/bot/telegramBot.js) — long-polling
//
// Locally you can still run them separately (`npm start` / `npm run bot`).
// In production, `node src/server.js` boots both. Each module self-starts on
// import (top-level side effects), so we just import them here.
// ─────────────────────────────────────────────

// Scheduler always runs.
await import('./cron.js')

// Signup bot runs only if a token is configured — mirrors the delivery step,
// which self-skips when TELEGRAM_BOT_TOKEN is unset. This keeps the whole
// service alive even before the bot is wired up.
if (process.env.TELEGRAM_BOT_TOKEN) {
  await import('./bot/telegramBot.js')
} else {
  console.warn('[server] TELEGRAM_BOT_TOKEN not set — signup bot disabled (pipeline still scheduled)')
}

console.log('[server] BriefCast is up — scheduler running; bot ' +
  (process.env.TELEGRAM_BOT_TOKEN ? 'polling' : 'disabled'))
