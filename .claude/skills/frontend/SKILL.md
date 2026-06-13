---
name: frontend
description: Use when building the BriefCast frontend — the Next.js signup web app where users register, pick their watchlist, choose plan/language, and pay. NOT BUILT YET; this skill defines the intended stack and conventions for when you start it.
---

# BriefCast frontend (signup web app)

> **Status: not built yet.** This skill captures the intended design so the
> frontend, when built, fits the existing backend and database.

## What it needs to do

Replace manual SQL inserts with a real signup flow:
1. User registers (Supabase Auth).
2. User picks their **watchlist** (NSE tickers — store bare symbols, no `.NS`).
3. User chooses **plan** (`free`/`pro`/`trader`) and **language**
   (`en`/`hinglish`), and sets `brief_time`.
4. Paid plans go through **Razorpay**.

## Intended stack

- **Next.js** (App Router).
- **Supabase Auth** for signup/login — the same Supabase project as the backend.
- **Razorpay** for payments.

## How it connects to the rest of the system

- **Auth → profiles:** Supabase Auth creates the `auth.users` row; the app then
  creates a matching `profiles` row (`profiles.id` = the auth user's id). See the
  **database** skill for the FK relationship.
- **Use the anon key + RLS on the client**, NOT the service_role key. The browser
  must never see the service key. RLS policies already restrict users to their
  own `profiles`, `watchlists`, and `briefs` rows via `auth.uid()`.
- **Watchlist writes** go to the `watchlists` table (unique on
  `(user_id, ticker)`); the nightly backend pipeline reads from there.
- Generated briefs appear in `briefs` (`status`, `audio_url`) — a dashboard can
  show the user their latest audio brief once delivery is built.

## Key distinction from the backend

| | Backend (pipeline) | Frontend (web app) |
|---|---|---|
| Supabase key | **service_role** (bypasses RLS) | **anon** (RLS enforced) |
| Runs | server, 3am batch | user's browser |
| Sees | all users | only the logged-in user |

When you start this, decide where it lives (likely a sibling `web/` or `app/`
directory or a separate repo) and add its conventions back into this skill.
