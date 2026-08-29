---
name: frontend
description: Use when working on the BriefCast frontend — the Next.js app in web/. Covers the built marketing landing page, its design system and conventions, plus the not-yet-built signup/dashboard/Razorpay surface.
---

# BriefCast frontend (`web/`)

The frontend lives in **`web/`** — a Next.js app, entirely separate from the Node
pipeline at the repo root. It has its own `package.json`, its own `node_modules`,
and its own deploy. The pipeline does not import from it and it does not import
from the pipeline.

## Status

- **Built:** the marketing landing page (`/`). Static, no auth, no database access.
  Every call to action deep-links to the Telegram bot.
- **Not built:** signup/login, a user dashboard, Razorpay checkout.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 — theme tokens live in `src/app/globals.css` under `@theme`,
  **not** in a `tailwind.config.js` (v4 has no config file by default)
- Fonts via `next/font/google`: Geist (sans), Geist Mono (mono, used for tickers,
  commands and timestamps), Instrument Serif (display headlines only)
- `turbopack.root` is pinned in `next.config.ts` — the repo root has its own
  lockfile, so Next otherwise infers the wrong workspace root

## Layout

```
web/src/
├── app/
│   ├── layout.tsx      # fonts, metadata, viewport
│   ├── page.tsx        # composes the sections, nothing else
│   └── globals.css     # @theme tokens + keyframes
├── components/         # one file per section, all server components
└── lib/site.ts         # bot URL, plan/pricing copy
```

## Conventions

- **Server components by default.** The landing page ships zero client JS — no
  `"use client"` anywhere. The FAQ accordion is `<details>/<summary>`; the nav is
  CSS-sticky. Keep it that way unless something genuinely needs state.
- **Content that is a business decision goes in `src/lib/site.ts`**, not in JSX —
  bot username, plan names, prices, feature lists.
- **Dark-only, deliberately.** There is no light mode and no `prefers-color-scheme`
  block. The palette is "pre-dawn": `ink` ground, `dawn` amber accent, `bright`/
  `muted`/`faint` type ramp, `up`/`down` for gains and losses. Use the tokens
  (`bg-ink`, `text-muted`, `border-line`), never raw hex in components.
- **Serif for display headlines only** (`font-serif`), sans for everything else,
  mono for anything that is literally machine output — tickers, `/commands`, times.
- **No hydration-unsafe values.** Waveform bar heights are derived deterministically,
  never `Math.random()`.
- Anything market-facing must keep the "information, not advice" posture. The SEBI
  disclaimer in `Footer.tsx` is not decorative — leave it visible.

## Deploying

Vercel, as a **separate project** from the Railway worker. Set the project's root
directory to `web/`; everything else is autodetected. The page is fully static
(`○ prerendered as static content`), so there is nothing to configure at runtime
and no env vars are needed today.

## When you build the signup/dashboard surface

- **Use the anon key + RLS on the client**, never the service_role key. RLS already
  restricts users to their own `profiles`, `watchlists` and `briefs` rows via
  `auth.uid()`. See the **database** skill.
- **Settle identity first.** `getOrCreateProfile()` in `src/bot/telegramBot.js`
  mints a synthetic auth user (`tg_<chat_id>@briefcast.local`) on first `/start`.
  If a web signup creates a real Supabase Auth user for the same person you get two
  `auth.users` rows for one human, and delivery breaks because the web-created
  profile has no `telegram_chat_id`. Either keep Telegram as the sole identity and
  have the web only handle payment, or add a linking flow via
  `t.me/briefcast_market_bot?start=<nonce>` (the bot already receives that payload).
- **Enforce the plan.** `profiles.plan` is currently unenforced — the pricing on the
  landing page is a placeholder. Limits belong in `generateScripts.js`, server-side.
