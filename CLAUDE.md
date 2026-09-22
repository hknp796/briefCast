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
The MP3 is stored and delivered to the user over Telegram (the bot sends the audio
file itself) before the 9:15am market open. Users sign up and manage their
watchlist entirely through the same Telegram bot — no web app.

The key efficiency idea: market data and news are fetched **once per unique
ticker**, not once per user. 1000 users × 10 stocks is not 10,000 fetches — after
deduplication it's ~300-500 unique tickers. Only the script + audio step is
per-user.

---

## Tech stack

- **Runtime:** Node.js 22+ (required — `@supabase/realtime-js` needs a native
  WebSocket, built in only from v22), ES modules (`"type": "module"` in package.json)
- **Database / Auth / Storage:** Supabase (Postgres)
- **Market data:** Python 3 + `yfinance`, called from Node via `child_process`
- **News:** Serper API (`google.serper.dev/news`)
- **Script generation:** Google Gemini 2.5 Flash via `@google/genai` (free tier)
- **Audio (TTS):** ElevenLabs via `@elevenlabs/elevenlabs-js`
- **Delivery:** Telegram Bot API — outbound via `axios` (deliverBriefs.js)
- **Signup bot:** Deno + `grammy`, deployed as a Supabase Edge Function
  (`supabase/functions/telegram-bot`) — NOT part of the Node app
- **Scheduler:** GitHub Actions cron (no in-app scheduler)
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
├── .github/workflows/
│   └── pipeline.yml          # nightly pipeline cron (3am IST) — the batch host
├── supabase/
│   ├── schema.sql            # all 5 tables + RLS policies
│   ├── config.toml           # Supabase CLI config (verify_jwt off for the bot)
│   └── functions/
│       └── telegram-bot/
│           └── index.ts      # the signup/watchlist bot (Deno + grammy)
├── web/                      # Next.js marketing site (landing page) — see below
│   ├── next.config.ts
│   └── src/
│       ├── app/              # App Router: layout.tsx, page.tsx, globals.css
│       ├── components/       # Nav, Hero, ChatMock, SampleBrief, HowItWorks,
│       │                     #   Features, Pricing, Faq, FinalCta, Footer
│       └── lib/site.ts       # bot URL + pricing copy (single source of truth)
└── src/
    ├── supabaseClient.js     # Supabase client singleton (service_role key)
    └── pipeline/
        ├── index.js          # orchestrator — runs all stages in order
        ├── allowlist.js          # optional PIPELINE_USER_ALLOWLIST cost guard
        ├── getUniqueTickers.js   # stage 1: dedupe watchlists
        ├── fetchMarketData.js    # stage 2: prices (calls fetch_prices.py)
        ├── fetch_prices.py       #   Python helper, yfinance
        ├── fetchNews.js          # stage 3: news headlines (Serper)
        ├── generateScripts.js    # stage 4: Gemini → brief script
        ├── generateAudio.js      # stage 5: ElevenLabs → MP3 → Storage
        └── deliverBriefs.js      # stage 6: send audio over Telegram
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
| 6 | `delivery` | deliverBriefs.js | briefs (ready, undelivered) + profiles.telegram_chat_id | Telegram audio + `briefs.delivered=true` |

Each stage is timed and logged to the `pipeline_logs` table via the `runStage()`
wrapper in `index.js`. A failure in any stage aborts the run (fail-fast) — except
delivery, which self-skips (does not abort) when `TELEGRAM_BOT_TOKEN` is unset, so
briefs stay `ready`/`undelivered` and get picked up on the next run once configured.

---

## Database schema (Supabase)

Five tables, defined in `supabase/schema.sql`:

- **profiles** — app-level user data. PK is `id` (FK → `auth.users.id`).
  Columns: email, name, `telegram_chat_id` (the user's identity — set on `/start`),
  plan (`free`/`pro`/`trader`), language (`en`/`hinglish`), brief_time, is_active.
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
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL   # optional, defaults to "Sarah"
TELEGRAM_BOT_TOKEN=...                      # from @BotFather; SAME token for the
                                            #   delivery step and the signup bot
PYTHON_PATH=/Users/<you>/Desktop/briefcast/venv/bin/python3   # local only; omit on server
PIPELINE_USER_ALLOWLIST=391345830           # OPTIONAL pre-launch cost guard — see below
```

`PIPELINE_USER_ALLOWLIST` is a comma-separated list of `telegram_chat_id`s. When
set, the pipeline serves **only** those accounts; unset/empty serves every active
user, which is the real production behaviour. It exists because ElevenLabs' free
tier is ~6 briefs/month and the bot marks every new signup `is_active=true`, so
one stranger running `/start` can eat the month's quota. Stages 1 and 4 apply it
(`src/pipeline/allowlist.js`); stages 5-6 inherit the scope automatically, since
they only ever work off the briefs stage 4 created. **Clear it before launch.**

---

## How to run

```bash
# Activate Python venv first (local dev)
source venv/bin/activate

# Run the entire pipeline immediately (all 6 stages) — the only Node entrypoint
npm run pipeline          # node src/pipeline/index.js

# Run a single stage standalone (for testing)
node src/pipeline/generateScripts.js
node src/pipeline/generateAudio.js
node src/pipeline/deliverBriefs.js

# The bot is a Supabase Edge Function, not a Node process
npm run bot:serve         # local: npx supabase functions serve telegram-bot
npm run bot:deploy        # ship it:  npx supabase functions deploy telegram-bot

# Landing page (separate app, separate deploy — nothing to do with the pipeline)
cd web && npm install && npm run dev     # http://localhost:3000
cd web && npm run build                  # static export-able production build
```

npm scripts: `pipeline` → `node src/pipeline/index.js`, `bot:serve` /
`bot:deploy` → the Supabase CLI for the Edge Function. There is no long-running
Node process any more — nothing to `npm start`.

---

## Deployment

BriefCast's two halves have opposite needs, so they're hosted separately — and
neither costs anything:

| Half | Shape | Runs on |
|------|-------|---------|
| Nightly pipeline | ~10 min batch, once a day | **GitHub Actions** cron (`.github/workflows/pipeline.yml`) |
| Telegram bot | reachable all day, tiny per-request work | **Supabase Edge Function** (`supabase/functions/telegram-bot`) |

Nothing has to stay awake, so there is no cold start on a user's first `/start`,
no keepalive ping, and no external cron service. There is **no application host
and no long-running process** — the Node side is a batch job, nothing else.

### Nightly pipeline — GitHub Actions

`.github/workflows/pipeline.yml` runs `node src/pipeline/index.js` at
`30 21 * * *` UTC (3:00am IST) on `ubuntu-latest`, with Node 22 + Python 3.12
installed by the standard setup actions. `PYTHON_PATH` is deliberately unset so
`fetchMarketData.js` falls back to the runner's system `python3`.

Setup:
1. Repo → **Settings → Secrets and variables → Actions** → add all seven:
   `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SERPER_API_KEY`, `GEMINI_API_KEY`,
   `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, `TELEGRAM_BOT_TOKEN`.
2. Optionally add a repo **variable** (Variables tab, not Secrets)
   `PIPELINE_USER_ALLOWLIST` = your `telegram_chat_id`, to keep pre-launch runs
   scoped to one account. Delete the variable to serve everyone.
3. **Actions** tab → *Nightly pipeline* → **Run workflow** to test on demand.
4. A failed run emails the repo owner; the run log is the pipeline log.

Notes: the schedule only fires from the **default branch**. GitHub's cron is
best-effort and can run 5-30 min late (harmless — briefs only need to exist by
~6:30am IST). GitHub also disables schedules on a repo with no commits for 60
days; any push re-arms it.

### Telegram bot — Supabase Edge Function

`supabase/functions/telegram-bot/index.ts` is a Deno/grammY port of
`src/bot/telegramBot.js` — same commands, same identity model, same
service_role client. It verifies Telegram's `x-telegram-bot-api-secret-token`
header itself, which is why `supabase/config.toml` sets `verify_jwt = false`
(Telegram sends its own header, not a Supabase JWT).

Setup:
```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>

# Secret must be 1-256 chars of A-Z a-z 0-9 _ - . Names can't start with SUPABASE_.
npx supabase secrets set TELEGRAM_BOT_TOKEN=<token> \
                         TELEGRAM_WEBHOOK_SECRET=$(openssl rand -hex 32)

npx supabase functions deploy telegram-bot   # add --no-verify-jwt on older CLIs

# Point Telegram at the function (do this LAST — it kicks any polling bot off).
curl "https://api.telegram.org/bot<token>/setWebhook" \
  -d "url=https://<project-ref>.supabase.co/functions/v1/telegram-bot" \
  -d "secret_token=<the same secret>"
```
Verify with `curl https://api.telegram.org/bot<token>/getWebhookInfo` (check
`pending_update_count` and `last_error_message`), then message the bot `/start`.
Logs live in the Supabase dashboard under Edge Functions → telegram-bot.

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected into Edge Functions
automatically — don't set them.

### Previous hosts (removed)

BriefCast previously ran as one always-on process (`src/server.js` — HTTP +
node-cron + a telegraf bot) on **Railway**, then **Render**. Both are gone:
Railway's free tier ran out, and Render has no free Background Worker, so it
needed a sleeping web service propped up by an external cron, a webhook, and a
`/healthz` self-ping. Splitting the app by duty cycle removed all of it.

Deleted in that cleanup: `src/server.js`, `src/cron.js`, `src/bot/telegramBot.js`,
`Dockerfile`, `.dockerignore`, `render.yaml`, `nixpacks.toml`, `railway.json`,
and the `telegraf` / `node-cron` / `@anthropic-ai/sdk` dependencies. Recoverable
from git history if a future feature ever needs a persistent process.

The landing page in `web/` is a separate deploy (Vercel, or a static host).

---

## Current status

**Done — the full data → script → audio → delivery loop works end to end:**
- [x] Supabase schema + RLS
- [x] Stage 1: ticker deduplication
- [x] Stage 2: market data (yfinance)
- [x] Stage 3: news (Serper)
- [x] Stage 4: script generation (Gemini)
- [x] Stage 5: audio generation (ElevenLabs → Supabase Storage)
- [x] Stage 6: delivery (Telegram — bot sends the MP3, marks `delivered`)
- [x] Orchestrator + cron scheduler
- [x] Telegram signup bot (`supabase/functions/telegram-bot/`) — signup + watchlist over
      chat (`/start`, `/add`, `/remove`, `/list`, `/language`, `/time`), replacing
      manual SQL inserts. This supersedes the Next.js signup web app for now.
- [x] Deployment — **no hosting bill, no host at all**: the pipeline runs as a
      GitHub Actions cron, the bot as a Supabase Edge Function. The old
      always-on Railway/Render process and its deploy files were deleted.
      See the "Deployment" section.
- [x] Landing page (`web/`) — Next.js marketing site. Static, no auth, no database
      access; every CTA deep-links to the Telegram bot. See the **frontend** skill.

**Not built yet:**
- [ ] **Payments** — Razorpay. The `plan` (free/pro/trader) column exists but is
      unenforced; no billing anywhere yet. Pricing shown on the landing page
      (`web/src/lib/site.ts`) is a PLACEHOLDER — set real numbers before launch and
      enforce the per-plan watchlist limits in `generateScripts.js`.
- [ ] **Linking web ↔ Telegram identity** — the bot mints a synthetic auth user
      (`tg_<chat_id>@briefcast.local`) in `getOrCreateProfile()`. Anything on the web
      that needs to know *which* user it is (checkout, a dashboard) needs a linking
      flow — e.g. `t.me/briefcast_market_bot?start=<nonce>`, with the bot reading the
      nonce from the `/start` payload. Decide this BEFORE building web auth, or you
      get two `auth.users` rows per human and delivery breaks.
- [ ] **Per-user brief_time delivery** — the pipeline runs once at 3am and delivers
      to everyone in one pass; `profiles.brief_time` is collected by the bot but not
      yet honoured for scheduling.
**Suggested next step:** Razorpay payments, or honouring per-user `brief_time`.

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

8. **Telegram delivery needs a *public* audio URL.** `sendAudio` passes the
   Supabase Storage URL and Telegram fetches it — so the `briefs-audio` bucket must
   be public (see gotcha 7). If the bucket is private, delivery fails.

9. **The pipeline and the bot are separate deploys in different runtimes.** The
   pipeline is Node, on GitHub Actions (outbound); the bot is Deno, on Supabase
   Edge Functions (inbound). They share only `TELEGRAM_BOT_TOKEN`, and each needs
   it set in its OWN secret store — GitHub Actions secrets and
   `supabase secrets set` respectively. Delivery self-skips (no abort) if the
   token is missing, so a missing GitHub secret looks like a silent no-op.

10. **The pipeline must exit non-zero on failure.** `runPipeline()` throws and
    the direct-run branch of `pipeline/index.js` exits 1 — that is what fails the
    GitHub Actions job and sends the failure email. A pipeline that swallowed its
    own errors would go silently dead every night.

11. **The Edge Function needs `verify_jwt = false`.** Telegram sends
    `x-telegram-bot-api-secret-token`, not a Supabase JWT, so with verification
    on, every webhook POST is rejected 401 and the bot goes silent with no error
    anywhere except `getWebhookInfo`. Set in `supabase/config.toml`.

12. **GitHub disables scheduled workflows after 60 days without a commit.** It
    emails first. Any push re-arms it — worth knowing during a quiet stretch.

13. **`PIPELINE_USER_ALLOWLIST` silently shrinks the run.** If it's set, only
    those chat_ids get briefs and everyone else is skipped with no error — by
    design, but it looks exactly like a bug. Both stages log a `⚠` line when it's
    active; check that first if users mysteriously stop receiving briefs. It must
    be cleared (locally AND in the GitHub repo variable) before launch.

14. **ElevenLabs free tier rejects some shared "library" voices** with
    `402 paid_plan_required` (including defaults like Rachel/George/Brian/Lily). The
    default voice is now "Sarah" (`EXAVITQu4vr4xnSDxMaL`); override via
    `ELEVENLABS_VOICE_ID` if you hit a 402.

---

## Cost notes

- **Gemini** — free tier: 1,500 requests/day. Covers ~1,500 daily users free.
  Tradeoff: free-tier prompts may be used for training (fine here — only public
  market data goes in).
- **Serper** — free tier: 2,500 searches/month. At ~400 tickers/night that's
  ~12,000/month, so this will need a paid plan or caching once live.
- **ElevenLabs** — free tier: ~10,000 chars/month (~6 full briefs). This is the
  main paid dependency, and the reason `PIPELINE_USER_ALLOWLIST` exists: scoped to
  one account a nightly run costs ~1,200 chars (~8 runs/month) instead of ~3,600. Consider `eleven_turbo_v2_5` model or alternative TTS
  (Google Cloud TTS) to cut cost at scale.
- **yfinance / Supabase** — free.
