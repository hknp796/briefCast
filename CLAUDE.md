# BriefCast — Project Context

> AI-powered personalised audio market briefing for Indian retail traders.
> Each morning before the NSE opens, every user gets a ~3-minute spoken brief
> about the stocks on their watchlist, delivered as audio.

This file is the working context for the project. Read it before making changes.

---

## What it does (one paragraph)

A nightly pipeline runs at 3am IST. It collects every active user's watchlist,
deduplicates the tickers, fetches overnight price data and news for each ticker
once (shared across all users), then for each user generates a personalised
spoken script with an LLM and converts that script to an MP3 with text-to-speech.
The MP3 is stored and (eventually) delivered to the user over WhatsApp before the
9:15am market open.

The key efficiency idea: market data and news are fetched **once per unique
ticker**, not once per user. 1000 users × 10 stocks is not 10,000 fetches — after
deduplication it's ~300-500 unique tickers. Only the script + audio step is
per-user.

---

## Tech stack

- **Runtime:** Node.js 20+, ES modules (`"type": "module"` in package.json)
- **Database / Auth / Storage:** Supabase (Postgres)
- **Market data:** Python 3 + `yfinance`, called from Node via `child_process`
- **News:** Serper API (`google.serper.dev/news`)
- **Script generation:** Google Gemini 2.5 Flash via `@google/genai` (free tier)
- **Audio (TTS):** ElevenLabs via `@elevenlabs/elevenlabs-js`
- **Scheduler:** `node-cron`
- **Other deps:** `@supabase/supabase-js`, `axios`, `dotenv`

---

## File structure

```
briefcast/
├── .env                      # secrets — NOT committed
├── .env.example              # template
├── .gitignore                # ignores .env, node_modules/, venv/
├── package.json              # type: module; scripts below
├── venv/                     # local Python venv (yfinance lives here)
├── supabase/
│   └── schema.sql            # all 5 tables + RLS policies
└── src/
    ├── supabaseClient.js     # Supabase client singleton (service_role key)
    ├── cron.js               # scheduler — runs pipeline at 3am IST
    └── pipeline/
        ├── index.js          # orchestrator — runs all stages in order
        ├── getUniqueTickers.js   # stage 1: dedupe watchlists
        ├── fetchMarketData.js    # stage 2: prices (calls fetch_prices.py)
        ├── fetch_prices.py       #   Python helper, yfinance
        ├── fetchNews.js          # stage 3: news headlines (Serper)
        ├── generateScripts.js    # stage 4: Gemini → brief script
        └── generateAudio.js      # stage 5: ElevenLabs → MP3 → Storage
```

---

## Pipeline stages (run in this order by `index.js`)

| # | Stage | File | Reads | Writes |
|---|-------|------|-------|--------|
| 1 | `get_tickers` | getUniqueTickers.js | watchlists + profiles | (returns ticker[]) |
| 2 | `market_data` | fetchMarketData.js | yfinance | `ticker_data` (prices, gap%) |
| 3 | `news` | fetchNews.js | Serper API | `ticker_data.news` (jsonb) |
| 4 | `scripts` | generateScripts.js | ticker_data + watchlists | `briefs.script` (status=pending) |
| 5 | `audio` | generateAudio.js | briefs (pending) | Storage + `briefs.audio_url` (status=ready) |

Each stage is timed and logged to the `pipeline_logs` table via the `runStage()`
wrapper in `index.js`. A failure in any stage aborts the run (fail-fast).

---

## Database schema (Supabase)

Five tables, defined in `supabase/schema.sql`:

- **profiles** — app-level user data. PK is `id` (FK → `auth.users.id`).
  Columns: email, name, plan (`free`/`pro`/`trader`), language (`en`/`hinglish`),
  brief_time, is_active.
- **watchlists** — one row per (user, ticker). Unique on `(user_id, ticker)`.
- **ticker_data** — nightly cache, one row per `(ticker, date)`. Holds prices,
  gap_pct, volume, and `news` (jsonb array of `{title, snippet, source, url}`).
- **briefs** — one row per `(user_id, date)`. Holds `script`, `audio_url`,
  `status` (`pending`/`ready`/`failed`), `delivered`.
- **pipeline_logs** — one row per stage per run, for debugging the 3am job.

RLS is enabled on profiles, watchlists, briefs (users see only their own rows).
`ticker_data` and `pipeline_logs` are server-side only. **The pipeline uses the
service_role key, which bypasses RLS** — this is required, see gotchas.

---

## Environment variables (.env)

```
SUPABASE_URL=https://xxxx.supabase.co     # base URL only — no /rest/v1, no trailing slash
SUPABASE_SERVICE_KEY=...                   # service_role key, NOT anon key
SERPER_API_KEY=...
GEMINI_API_KEY=...                         # free at aistudio.google.com
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM   # optional, defaults to "Rachel"
PYTHON_PATH=/Users/<you>/Desktop/briefcast/venv/bin/python3   # local only; omit on server
```

---

## How to run

```bash
# Activate Python venv first (local dev)
source venv/bin/activate

# Run the entire pipeline immediately (all 5 stages)
RUN_NOW=true node src/cron.js

# Or run the pipeline without the scheduler
node src/pipeline/index.js

# Run a single stage standalone (for testing)
node src/pipeline/generateScripts.js
node src/pipeline/generateAudio.js

# Start the scheduler (production — waits for 3am IST)
npm start
```

npm scripts: `start` → `node src/cron.js`, `pipeline` → `node src/pipeline/index.js`,
`dev` → `RUN_NOW=true node src/cron.js`.

---

## Current status

**Done — the full data → script → audio core loop works:**
- [x] Supabase schema + RLS
- [x] Stage 1: ticker deduplication
- [x] Stage 2: market data (yfinance)
- [x] Stage 3: news (Serper)
- [x] Stage 4: script generation (Gemini)
- [x] Stage 5: audio generation (ElevenLabs → Supabase Storage)
- [x] Orchestrator + cron scheduler

**Not built yet:**
- [ ] **Delivery** — `deliverBriefs.js`: read `status=ready` briefs, send audio
      link via WhatsApp (WATI or Twilio). For testing, can email the link instead.
- [ ] **Signup web app** — frontend (Next.js) for users to register and pick
      their watchlist, replacing manual SQL inserts. Supabase Auth + Razorpay.
- [ ] **Deployment** — Railway. Needs `requirements.txt` (`pip freeze`) and a
      `nixpacks.toml` declaring python312 + nodejs_20. On server, omit PYTHON_PATH
      so it falls back to system `python3`.

**Suggested next file:** `deliverBriefs.js`.

---

## Conventions (match these when adding code)

- ES modules everywhere (`import`/`export`), `.js` extensions in import paths.
- Each stage exports one async function; logs with a `[stageName]` prefix.
- Per-user work uses a simple **concurrency pool** (N workers pulling from a
  shared index) — see `runPool()` in generateScripts.js / generateAudio.js.
  Keep concurrency low (2-5) to respect free-tier API rate limits.
- DB writes use `upsert` with `onConflict` so re-running a day is idempotent.
- Stages read/write by **today's date** (`new Date().toISOString().split('T')[0]`).

---

## Gotchas (things that already bit us — don't repeat)

1. **Use the `service_role` key, not the `anon` key.** With RLS enabled, the anon
   key silently returns an empty array (count: 0) with NO error. If a query reads
   zero rows but throws no error, this is almost always the cause.

2. **`SUPABASE_URL` must be the bare base URL** — `https://xxxx.supabase.co`.
   No `/rest/v1`, no trailing slash. Otherwise you get `PGRST125 Invalid path`.

3. **Local Python is a venv.** `PYTHON_PATH` in `.env` points Node at
   `venv/bin/python3`. On a server, leave PYTHON_PATH unset — the code falls back
   to system `python3`. (On macOS, system pip is externally-managed; always use
   the venv, and `pip3` not `pip`.)

4. **Stages 4 and 5 query by today's date.** If `ticker_data` only has rows from
   a previous day, script generation logs "no ticker data found, skipping". Fix by
   running the full pipeline (stages 2-3 stamp today's date) before stages 4-5.

5. **NSE tickers need the `.NS` suffix for yfinance** (e.g. `RELIANCE.NS`). This
   is handled inside `fetch_prices.py`.

6. **Seeding test users:** `profiles.id` is an FK to `auth.users.id`. You can't
   insert a profile without a matching auth.users row. For manual test data,
   insert into `auth.users` first (or create the user via Supabase Auth).

7. **`generateAudio.js` needs a public Storage bucket named `briefs-audio`.**
   Create it in Supabase → Storage before running stage 5.

---

## Cost notes

- **Gemini** — free tier: 1,500 requests/day. Covers ~1,500 daily users free.
  Tradeoff: free-tier prompts may be used for training (fine here — only public
  market data goes in).
- **Serper** — free tier: 2,500 searches/month. At ~400 tickers/night that's
  ~12,000/month, so this will need a paid plan or caching once live.
- **ElevenLabs** — free tier: ~10,000 chars/month (~6 full briefs). This is the
  main paid dependency. Consider `eleven_turbo_v2_5` model or alternative TTS
  (Google Cloud TTS) to cut cost at scale.
- **yfinance / Supabase** — free.
