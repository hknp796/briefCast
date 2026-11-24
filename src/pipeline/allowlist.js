// ─────────────────────────────────────────────
// Optional pre-launch cost guard.
//
// While BriefCast is being tested, every brief spends free-tier API quota
// (Gemini scripts + TTS have daily caps; ElevenLabs, the old TTS, allowed only
// ~6 briefs/month). One curious stranger running /start and /add would quietly
// spend it, because the bot marks every new profile is_active=true.
//
// PIPELINE_USER_ALLOWLIST is a comma-separated list of telegram_chat_ids. When
// set, the pipeline serves ONLY those accounts — stages 1 and 4 filter on it,
// and stages 5/6 inherit the scope automatically because they work off the
// briefs stage 4 created. Unset (the default) = serve every active user, which
// is the real production behaviour.
//
// This is deliberately NOT is_active=false on other people's rows: it leaves
// their data untouched, and it keeps working for accounts that sign up later.
// ─────────────────────────────────────────────
export function allowedChatIds() {
  const ids = (process.env.PIPELINE_USER_ALLOWLIST || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  return ids.length ? ids : null
}

// Called once per stage that filters, so a scoped run is obvious in the logs
// rather than looking like "everyone else mysteriously got no brief".
export function logAllowlist(stage, ids) {
  if (ids) console.log(`[${stage}] ⚠ PIPELINE_USER_ALLOWLIST active — only chat_id(s) ${ids.join(', ')}`)
}
