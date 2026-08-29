# BriefCast — landing page

The marketing site for [BriefCast](../CLAUDE.md). Static, no auth, no database.
Every call to action deep-links to the Telegram bot, [@briefcast_market_bot](https://t.me/briefcast_market_bot).

This app is independent of the Node pipeline at the repo root — separate
`package.json`, separate deploy.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (fully static)
```

## Where things are

| Path | What |
|---|---|
| `src/app/page.tsx` | composes the sections, nothing else |
| `src/app/globals.css` | Tailwind v4 `@theme` tokens (there is no `tailwind.config.js`) |
| `src/components/` | one file per section |
| `src/lib/site.ts` | **bot URL and pricing — edit copy here, not in JSX** |

## Before launch

Pricing in `src/lib/site.ts` is a **placeholder**. Payments are not built and
`profiles.plan` is not enforced by the pipeline — every signup currently gets the
full experience. Set real numbers and enforce the limits in
`src/pipeline/generateScripts.js` before charging anyone.

## Deploying

Vercel, as its own project, separate from the Railway worker that runs the
pipeline. Set the Vercel project's **root directory to `web/`**; everything else
is autodetected. No environment variables are needed today.

Conventions live in the **frontend** skill (`.claude/skills/frontend/SKILL.md`).
