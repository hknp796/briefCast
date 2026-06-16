-- ─────────────────────────────────────────────
-- BriefCast — Supabase schema
-- Run this in your Supabase SQL editor
-- ─────────────────────────────────────────────

-- 1. USERS
-- Supabase auth.users handles auth automatically.
-- This table stores app-level profile data.
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  name        text,
  phone       text,                           -- WhatsApp number, E.164 e.g. '+919876543210'
  plan        text not null default 'free',   -- 'free' | 'pro' | 'trader'
  language    text not null default 'en',     -- 'en' | 'hinglish'
  brief_time  text not null default '07:00',  -- delivery time in IST e.g. '07:00'
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- For existing databases (create table above is a no-op once profiles exists):
alter table public.profiles add column if not exists phone text;

-- 2. WATCHLISTS
-- Each row = one stock on one user's watchlist
create table if not exists public.watchlists (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  ticker      text not null,                  -- NSE symbol e.g. 'RELIANCE'
  added_at    timestamptz not null default now(),
  unique (user_id, ticker)                    -- no duplicates per user
);

-- Index for fast lookup: "give me all tickers for user X"
create index if not exists idx_watchlists_user_id on public.watchlists(user_id);

-- 3. TICKER DATA CACHE
-- Written once per ticker per night by the pipeline.
-- All user workers read from here — not from the API directly.
create table if not exists public.ticker_data (
  id              bigint generated always as identity primary key,
  ticker          text not null,
  date            date not null default current_date,

  -- Price data
  prev_close      numeric,
  open            numeric,
  high            numeric,
  low             numeric,
  close           numeric,
  volume          bigint,
  gap_pct         numeric,      -- gap% = (open - prev_close) / prev_close * 100

  -- News (top 3 headlines stored as JSON array)
  news            jsonb,        -- [{ title, snippet, source, url }]

  -- Meta
  fetched_at      timestamptz not null default now(),

  unique (ticker, date)         -- one row per ticker per day
);

-- Index for fast lookup: "give me data for ticker X on date Y"
create index if not exists idx_ticker_data_ticker_date on public.ticker_data(ticker, date);

-- 4. BRIEFS
-- One row per generated brief per user per day.
-- Stores the script text and the audio file URL.
create table if not exists public.briefs (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  date        date not null default current_date,
  script      text,             -- Claude-generated script
  audio_url   text,             -- ElevenLabs MP3 stored in Supabase Storage
  status      text not null default 'pending', -- 'pending' | 'ready' | 'failed'
  delivered   boolean not null default false,
  created_at  timestamptz not null default now(),

  unique (user_id, date)        -- one brief per user per day
);

-- Index for delivery worker: "give me all undelivered briefs for today"
create index if not exists idx_briefs_date_delivered on public.briefs(date, delivered);

-- 5. PIPELINE LOGS
-- Tracks each nightly run — useful for debugging 3am failures
create table if not exists public.pipeline_logs (
  id          bigint generated always as identity primary key,
  run_date    date not null default current_date,
  stage       text not null,    -- 'market_data' | 'news' | 'scripts' | 'audio'
  status      text not null,    -- 'success' | 'failed'
  message     text,
  duration_ms integer,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- Users can only see their own data
-- ─────────────────────────────────────────────
alter table public.profiles   enable row level security;
alter table public.watchlists enable row level security;
alter table public.briefs     enable row level security;

create policy "Users see own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users manage own watchlist"
  on public.watchlists for all using (auth.uid() = user_id);

create policy "Users see own briefs"
  on public.briefs for select using (auth.uid() = user_id);

-- ticker_data and pipeline_logs are server-side only — no RLS needed
-- The pipeline uses the service role key which bypasses RLS
