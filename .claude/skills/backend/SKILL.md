---
name: backend
description: Use when working on BriefCast backend code — the Node.js nightly pipeline, its stages, the cron scheduler, API integrations (yfinance, Serper, Gemini, ElevenLabs), or running/debugging the pipeline locally.
---

# BriefCast backend

The backend is a **Node.js 20+ ES-module** app: a nightly pipeline plus a cron
scheduler. There is no web server — it's a batch job that runs at 3am IST.

**Stack:** Node 20+ (`"type": "module"`), Supabase JS client, Python 3 +
`yfinance` (called via `child_process`), Serper (news), Google Gemini 2.5 Flash
(scripts), ElevenLabs (TTS), `node-cron`, `axios`, `dotenv`.

## Layout

```
src/
├── supabaseClient.js          # Supabase singleton (service_role key)
├── cron.js                    # scheduler — runs pipeline at 3am IST
└── pipeline/
    ├── index.js               # orchestrator — runs 5 stages in order
    ├── getUniqueTickers.js     # 1. dedupe watchlists → ticker[]
    ├── fetchMarketData.js      # 2. prices (shells out to fetch_prices.py)
    ├── fetch_prices.py         #    yfinance helper
    ├── fetchNews.js            # 3. news headlines (Serper)
    ├── generateScripts.js      # 4. Gemini → briefs.script (status=pending)
    └── generateAudio.js        # 5. ElevenLabs → Storage → audio_url (status=ready)
```

Stages run in order; the pipeline **fails fast** (any throw → `process.exit(1)`).
Each stage is wrapped in `runStage()` which times it and logs to `pipeline_logs`.

**Core efficiency idea:** market data + news are fetched **once per unique
ticker** (deduped across all users), not once per user. Only stages 4–5 are
per-user.

## Conventions (match these)

- ES modules, `.js` extensions in import paths.
- Each stage exports **one async function**, logs with a `[stageName]` prefix.
- Per-user work uses a **concurrency pool** (`runPool` in generateScripts.js /
  generateAudio.js) — N workers pulling from a shared index. Keep concurrency
  **2–5** to respect free-tier rate limits.
- DB writes use `upsert` with `onConflict` → re-running a day is idempotent.
- Everything works by **today's date**: `new Date().toISOString().split('T')[0]`.
- Each stage file has a direct-run guard at the bottom for standalone testing.
- Guard required env vars at the top of the export and `throw` if missing.

## Running

```bash
source venv/bin/activate                # stage 2 needs yfinance from the venv
RUN_NOW=true node src/cron.js           # full pipeline now (npm run dev)
node src/pipeline/index.js              # full pipeline, no scheduler
node src/pipeline/generateScripts.js    # one stage standalone
```

## Gotchas

- **Order trap:** stages 4–5 read `ticker_data`/`briefs` by *today's* date. Run
  2–3 first (they stamp today) or you get "no ticker data, skipping".
- **venv:** `.env`'s `PYTHON_PATH` → `venv/bin/python3` locally; omit on server
  (falls back to system `python3`). macOS system pip is externally-managed — use
  the venv and `pip3`.
- **NSE tickers** get `.NS` added inside `fetch_prices.py` — store bare symbols.
- For Supabase/RLS/key issues, see the **database** skill.

## Not built yet
- `deliverBriefs.js` — read `status=ready` briefs, send `audio_url` over WhatsApp
  (WATI/Twilio) or email for testing, set `delivered=true`. Wire into `index.js`
  via `runStage('delivery', deliverBriefs)`. This is the suggested next file.
- Deployment on Railway — needs `requirements.txt` + `nixpacks.toml`
  (python312 + nodejs_20), and unset `PYTHON_PATH` on the server.
