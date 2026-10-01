import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import TelegramButton from "@/components/TelegramButton";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About BriefCast — Pre-Market Intelligence for Indian Retail Traders",
  description:
    "Learn about BriefCast, our mission, our autonomous AI morning briefing pipeline, and the engineering principles behind our pre-market audio briefs.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-24">
        {/* Breadcrumb & Meta */}
        <div className="flex items-center gap-2 text-xs font-mono text-faint">
          <Link href="/" className="hover:text-bright transition-colors">Home</Link>
          <span>/</span>
          <span className="text-dawn">About</span>
        </div>

        {/* Title */}
        <h1 className="mt-6 font-serif text-4xl leading-[1.1] tracking-[-0.02em] sm:text-5xl">
          Calm, objective pre-market intelligence before the opening bell.
        </h1>
        <p className="mt-4 text-[0.88rem] text-faint">
          Published: January 2025 · Last updated: October 2026 · By {site.author.name}, {site.author.role}
        </p>

        {/* Mission */}
        <div className="mt-12 space-y-6 text-[1rem] leading-relaxed text-muted border-b border-line-soft pb-12">
          <p>
            Between 8:30 AM and 9:15 AM every trading day in India, retail traders are flooded with information:
            dozens of Telegram groups pushing unverified tips, noisy financial news channels shouting ticker headlines,
            and fragmented WhatsApp forwards.
          </p>
          <p>
            BriefCast was built to do the exact opposite: cut through the chaotic noise and hand you a calm, concise,
            3-minute spoken audio brief covering <strong className="text-bright font-medium">only the stocks on your watchlist</strong>.
            You listen while brewing coffee or getting ready, and enter the 9:15 AM market open with total clarity.
          </p>
        </div>

        {/* Founder & Author Byline */}
        <section className="mt-12 border-b border-line-soft pb-12">
          <span className="text-xs font-mono uppercase tracking-wider text-dawn">Author & Founder</span>
          <h2 className="mt-2 font-serif text-2xl tracking-tight sm:text-3xl text-bright">
            Who builds BriefCast
          </h2>
          <div className="mt-6 flex flex-col gap-6 rounded-xl border border-line-soft bg-surface/60 p-6 sm:flex-row sm:items-start">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface-2 border border-line text-xl font-semibold text-dawn">
              H
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-semibold text-bright">{site.author.name}</h3>
                <span className="rounded-full bg-dawn/10 px-2.5 py-0.5 text-xs font-medium text-dawn">
                  {site.author.role}
                </span>
                <span className="text-xs text-faint">📍 {site.location}</span>
              </div>
              <p className="mt-3 text-[0.92rem] leading-relaxed text-muted">
                Hari is a software engineer and algorithmic systems developer based in Calicut, Kerala.
                With a deep interest in financial market microstructure and distributed data pipelines, he
                designed BriefCast to bridge the gap between institutional pre-market briefings and everyday Indian retail traders.
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-xs font-mono text-faint">
                <span>Specialization: Distributed Pipelines & LLM Synthesis</span>
                <span>•</span>
                <span>Focus: NSE Equities & Market Microstructure</span>
              </div>
            </div>
          </div>
        </section>

        {/* How the Pipeline Works */}
        <section className="mt-12 border-b border-line-soft pb-12">
          <span className="text-xs font-mono uppercase tracking-wider text-dawn">Technical Transparency</span>
          <h2 className="mt-2 font-serif text-2xl tracking-tight sm:text-3xl text-bright">
            How the autonomous briefing pipeline works
          </h2>
          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-line-soft bg-surface/30 p-5">
              <h3 className="text-sm font-semibold text-bright">1. Watchlist Aggregation & Deduplication</h3>
              <p className="mt-1 text-sm text-muted">
                Active user watchlists are aggregated and deduplicated across all National Stock Exchange (NSE) tickers, ensuring efficient, single-pass data retrieval.
              </p>
            </div>
            <div className="rounded-lg border border-line-soft bg-surface/30 p-5">
              <h3 className="text-sm font-semibold text-bright">2. Overnight Price Action & News Gathering</h3>
              <p className="mt-1 text-sm text-muted">
                Official closing prices, overnight global ADRs, and verified regulatory filings or corporate announcements are ingested from reputable financial data providers.
              </p>
            </div>
            <div className="rounded-lg border border-line-soft bg-surface/30 p-5">
              <h3 className="text-sm font-semibold text-bright">3. Prompt-Constrained Script Synthesis</h3>
              <p className="mt-1 text-sm text-muted">
                Using Google Gemini, custom scripts are synthesized strictly around what moved and why. Prompts enforce complete neutrality with zero speculative tips or directional recommendations.
              </p>
            </div>
            <div className="rounded-lg border border-line-soft bg-surface/30 p-5">
              <h3 className="text-sm font-semibold text-bright">4. Neural Audio Generation & Delivery</h3>
              <p className="mt-1 text-sm text-muted">
                ElevenLabs converts the script into natural, human-grade speech (in English or Hinglish), delivering the MP3 audio file directly into your Telegram inbox before 8:00 AM IST.
              </p>
            </div>
          </div>
        </section>

        {/* SEBI Compliance & Non-Advisory Posture */}
        <section className="mt-12">
          <span className="text-xs font-mono uppercase tracking-wider text-dawn">Compliance & Trust</span>
          <h2 className="mt-2 font-serif text-2xl tracking-tight sm:text-3xl text-bright">
            Our non-advisory commitment
          </h2>
          <p className="mt-4 text-[0.95rem] leading-relaxed text-muted">
            BriefCast is strictly an informational and educational intelligence tool. We are not a SEBI-registered
            investment adviser (RIA) or research analyst (RA). We will never advise you to buy, sell, or hold any security,
            nor do we recommend options strikes or penny stock calls. Every trading decision remains 100% yours.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <TelegramButton className="!px-6 !py-3 !text-sm">Try BriefCast Free</TelegramButton>
            <Link
              href="/editorial-policy"
              className="inline-flex items-center rounded-lg border border-line px-5 py-3 text-sm font-medium text-bright transition-colors hover:border-muted"
            >
              Read our Editorial Policy →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
