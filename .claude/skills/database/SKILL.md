---
name: database
description: Use when working with the BriefCast database — Supabase/Postgres schema, the 5 tables, RLS policies, the service_role vs anon key rule, seeding test users, or any query/migration against profiles, watchlists, ticker_data, briefs, or pipeline_logs.
---

# BriefCast database (Supabase / Postgres)

Schema lives in [supabase/schema.sql](../../../supabase/schema.sql) — run it in
the Supabase SQL editor. Access it from Node via the singleton in
[src/supabaseClient.js](../../../src/supabaseClient.js), which uses the
**service_role key**.

## The 5 tables

| Table | Grain | Key columns |
|-------|-------|-------------|
| **profiles** | one per user | `id` (FK → `auth.users.id`), email, name, `plan` (free/pro/trader), `language` (en/hinglish), brief_time, `is_active` |
| **watchlists** | one per (user, ticker) | `user_id`, `ticker` (bare NSE symbol). Unique `(user_id, ticker)` |
| **ticker_data** | one per (ticker, date) | prev_close, open, high, low, close, volume, `gap_pct`, `news` (jsonb `[{title,snippet,source,url}]`). Unique `(ticker, date)` |
| **briefs** | one per (user, date) | `script`, `audio_url`, `status` (pending/ready/failed), `delivered`. Unique `(user_id, date)` |
| **pipeline_logs** | one per stage per run | run_date, stage, status, message, duration_ms |

`ticker_data` is the shared nightly cache — written once per ticker, read by all
per-user workers. `pipeline_logs` records each 3am run for debugging.

## RLS and the key rule (read this)

- RLS is **enabled** on `profiles`, `watchlists`, `briefs` — users see only their
  own rows (`auth.uid() = id` / `user_id`).
- `ticker_data` and `pipeline_logs` have **no RLS** — server-side only.
- **The pipeline uses the `service_role` key, which bypasses RLS.** This is
  required for the server to read across all users.
- **Critical gotcha:** with the anon key, a read on an RLS table returns `[]`
  (count 0) with **no error**. If a query reads zero rows but throws nothing,
  it's almost always the wrong key.

## Conventions

- Writes use `upsert` with `onConflict` matching the unique constraint, so
  re-running a day is idempotent (e.g. `onConflict: 'user_id,date'`).
- Rows are stamped/queried by **today's date**
  (`new Date().toISOString().split('T')[0]`).

## Gotchas

- **`SUPABASE_URL` must be the bare base URL** — `https://xxxx.supabase.co`, no
  `/rest/v1`, no trailing slash. Otherwise → `PGRST125 Invalid path`.
- **Use service_role, not anon** (see above) — silent empty reads.
- **Seeding test users:** `profiles.id` is an FK to `auth.users.id`. You can't
  insert a profile without a matching auth user. Create the auth user first
  (`supabase.auth.admin.createUser`), then upsert the profile with that same id,
  then insert watchlist rows. `is_active` must be `true` or stage 4 skips them.
- **Storage:** stage 5 needs a public bucket named `briefs-audio`.
