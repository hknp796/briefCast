// ─────────────────────────────────────────────
// Single source of truth for everything on the landing page that is a
// business decision rather than a design one. Edit here, not in the JSX.
// ─────────────────────────────────────────────

/** The live bot — @briefcast_market_bot. Every CTA on the page points here. */
export const BOT_USERNAME = "briefcast_market_bot";
export const BOT_URL = `https://t.me/${BOT_USERNAME}`;

export const site = {
  name: "BriefCast",
  title: "BriefCast — Pre-Market Audio Brief for NSE Traders",
  tagline: "Your watchlist, read to you before the market opens.",
  description:
    "Personalised 3-minute audio market brief for Indian retail traders. Overnight moves on your watchlist delivered on Telegram before the NSE opens.",
  url: "https://briefcast.in",
  email: "contact@briefcast.in",
  location: "Calicut, Kerala, India",
  author: {
    name: "Hari",
    role: "Founder & Software Engineer",
    bio: "Software engineer and quantitative finance enthusiast based in Calicut, Kerala. Building autonomous AI tools that provide Indian retail traders with objective pre-market intelligence.",
  },
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
    q: "Which stocks can I add to my watchlist?",
    a: "You can track any equity security listed on the National Stock Exchange of India (NSE), including Largecap, Midcap, and Smallcap stocks. Simply add the symbol without the .NS suffix—like /add INFY, /add TATAMOTORS, or /add RELIANCE. The bot confirms valid symbols instantly against official NSE listings.",
  },
  {
    q: "What time does the market brief arrive?",
    a: "Every trading day before the 9:15am IST opening bell. The default delivery time is 8:00am IST, giving you plenty of time before the 9:00am pre-open session. Pro and Trader subscribers can customize their delivery time to match their morning schedule using /time.",
  },
  {
    q: "Where does the market data and news come from?",
    a: "Overnight and previous-session price action is sourced from verified public market data feeds. Contextual news, quarterly earnings, regulatory disclosures, and corporate filings are gathered fresh each night from trusted financial publications to explain the root driver behind each stock's move.",
  },
  {
    q: "How is BriefCast different from stock tip channels or advisory bots?",
    a: "BriefCast is an objective, automated market intelligence tool, not an advisory service or tip channel. We never issue buy, sell, or hold recommendations, nor do we promote speculative trades. Our AI agent simply summarizes verified overnight news and price action for your specific watchlist so you make informed decisions yourself.",
  },
  {
    q: "Can I get my briefing in Hinglish?",
    a: "Yes. BriefCast offers full support for both English and natural Hinglish audio briefings. In Hinglish mode, stock names, price levels, and financial figures remain in English, while the narrative commentary is delivered in conversational Hindi. You can switch anytime using the /language command.",
  },
  {
    q: "Is this financial advice?",
    a: "No, and it is deliberately built not to be. BriefCast reports what moved and flags key levels or context worth watching. It will never tell you to buy, sell, or hold, and it is not a SEBI-registered investment adviser or research analyst. Every trading decision remains entirely yours.",
  },
  {
    q: "How do I stop or change my watchlist?",
    a: "Message the bot inside Telegram. There is no billing or credit card to unwind on the free plan, and paid subscriptions can be paused or cancelled directly from the chat. You can add, edit, or remove stocks from your watchlist anytime with /add, /remove, and /list.",
  },
] as const;

