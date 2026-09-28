// ─────────────────────────────────────────────
// Single source of truth for everything on the landing page that is a
// business decision rather than a design one. Edit here, not in the JSX.
// ─────────────────────────────────────────────

/** The live bot — @briefcast_market_bot. Every CTA on the page points here. */
export const BOT_USERNAME = "briefcast_market_bot";
export const BOT_URL = `https://t.me/${BOT_USERNAME}`;

export const site = {
  name: "BriefCast",
  tagline: "Your watchlist, read to you before the market opens.",
  description:
    "A personalised three-minute audio market brief for Indian retail traders. Overnight moves on the stocks you actually own, delivered on Telegram before the NSE opens at 9:15am.",
  url: "https://briefcast.in",
} as const;

// ─────────────────────────────────────────────
// PRICING IS A PLACEHOLDER. Payments are not built yet (Razorpay is the next
// milestone) and `profiles.plan` is currently unenforced by the pipeline —
// every signup gets the full experience today. Set real numbers here before
// launch, and enforce the limits in generateScripts.js.
// ─────────────────────────────────────────────
export const plans = [
  {
    id: "free",
    name: "Free",
    price: "₹0",
    cadence: "forever",
    pitch: "Enough to know whether you'd miss it.",
    features: [
      "Up to 5 stocks",
      "Brief every trading day",
      "English",
      "Delivered at 8:00am IST",
    ],
    cta: "Start free",
    featured: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹199",
    cadence: "per month",
    pitch: "For a real portfolio and a real routine.",
    features: [
      "Up to 20 stocks",
      "English or Hinglish",
      "Pick your own delivery time",
      "Deeper news coverage per stock",
    ],
    cta: "Go Pro",
    featured: true,
  },
  {
    id: "trader",
    name: "Trader",
    price: "₹499",
    cadence: "per month",
    pitch: "For people who are at the screen at 9:15.",
    features: [
      "Up to 50 stocks",
      "Everything in Pro",
      "Sector and index context",
      "Priority delivery, first out the door",
    ],
    cta: "Go Trader",
    featured: false,
  },
] as const;

export const faqs = [
  {
    q: "How does the BriefCast AI agent work?",
    a: "BriefCast is an autonomous AI market briefing agent. Every night before the NSE opens, it tracks your personal watchlist, aggregates overnight price movements and verified news, synthesizes a concise 3-minute personalized audio briefing using LLMs, and delivers the spoken MP3 directly to your Telegram chat.",
  },
  {
    q: "Do I need to install anything?",
    a: "No. If you already have Telegram, that's the whole stack. BriefCast is a bot inside it — there's no BriefCast app, no website to log into, and no password to remember.",
  },
  {
    q: "Which stocks can I add?",
    a: "Anything listed on the NSE. Add the plain symbol without the .NS suffix — /add INFY, /add TATAMOTORS, /add M&M. If a symbol isn't recognised the bot tells you straight away.",
  },
  {
    q: "What time does it arrive?",
    a: "Before the 9:15am open, every trading day. The default is 8:00am IST and paid plans can set their own time with /time 07:00.",
  },
  {
    q: "Where does the information come from?",
    a: "Overnight and previous-session price data comes from public market data feeds. The context around each move comes from published news coverage on that stock, gathered fresh each night.",
  },
  {
    q: "Is this financial advice?",
    a: "No, and it's deliberately built not to be. BriefCast reports what moved and flags one thing worth watching. It will never tell you to buy, sell or hold, and it isn't a registered investment adviser. Every decision is yours.",
  },
  {
    q: "How do I stop?",
    a: "Message the bot and stop. There's no billing to unwind on the free plan, and paid plans cancel from the same chat. You can clear your watchlist any time with /remove.",
  },
] as const;

