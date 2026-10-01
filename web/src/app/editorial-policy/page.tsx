import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Editorial & Accuracy Policy — BriefCast",
  description:
    "Discover how BriefCast sources market data, validates overnight financial news, enforces AI anti-hallucination guardrails, and handles corrections.",
  alternates: {
    canonical: "/editorial-policy",
  },
};

export default function EditorialPolicyPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-24">
        {/* Breadcrumb & Meta */}
        <div className="flex items-center gap-2 text-xs font-mono text-faint">
          <Link href="/" className="hover:text-bright transition-colors">Home</Link>
          <span>/</span>
          <span className="text-dawn">Editorial Policy</span>
        </div>

        {/* Title */}
        <h1 className="mt-6 font-serif text-4xl leading-[1.1] tracking-[-0.02em] sm:text-5xl">
          Editorial & Accuracy Policy
        </h1>
        <p className="mt-4 text-[0.88rem] text-faint">
          Published: January 2025 · Last updated: October 2026 · Maintained by {site.author.name}, {site.author.role}
        </p>

        <div className="mt-10 space-y-12 text-[0.96rem] leading-relaxed text-muted">
          {/* Section 1 */}
          <section className="space-y-4">
            <h2 className="font-serif text-2xl text-bright">1. Core Editorial Principles</h2>
            <p>
              BriefCast is an objective morning intelligence service designed specifically for Indian retail traders.
              Our sole mission is to inform traders of factual overnight developments before the 9:15 AM IST opening bell.
            </p>
            <p>
              We adhere strictly to three foundational tenets:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-bright font-medium">Factuality over Speculation:</strong> We report recorded closing prices, official corporate filings, and verified earnings reports. We never publish speculative rumors, anonymous message-board chatter, or &quot;insider tips&quot;.</li>
              <li><strong className="text-bright font-medium">Neutrality of Tone:</strong> Financial journalism often sensationalizes market swings. BriefCast enforces an understated, sober tone that avoids emotive adjectives such as &quot;rocket&quot;, &quot;crash&quot;, &quot;plunge&quot;, or &quot;multibagger&quot;.</li>
              <li><strong className="text-bright font-medium">Zero Conflicts of Interest:</strong> BriefCast does not accept paid promotions, sponsored ticker inclusions, or remuneration from publicly traded companies or promotional syndicates.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-4 border-t border-line-soft pt-10">
            <h2 className="font-serif text-2xl text-bright">2. Market Data Sourcing & Verification</h2>
            <p>
              BriefCast aggregates market data nightly at 3:00 AM IST prior to morning delivery:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-bright font-medium">NSE Equity Symbols:</strong> All symbols are verified against the active National Stock Exchange of India (NSE) database. Unknown, invalid, or delisted tickers are blocked automatically at watchlist registration.</li>
              <li><strong className="text-bright font-medium">Price Action & Levels:</strong> Historical closing figures, previous day highs/lows, and overnight global ADR quotes (e.g. INFYS, WIT) are ingested through standard financial market APIs.</li>
              <li><strong className="text-bright font-medium">Corporate Filings & Press:</strong> Contextual headlines explaining price action are gathered from reputable, established business media and official stock exchange disclosures (BSE/NSE announcements).</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-4 border-t border-line-soft pt-10">
            <h2 className="font-serif text-2xl text-bright">3. Artificial Intelligence Guardrails & Fact-Checking</h2>
            <p>
              We utilize advanced Large Language Models (LLMs) to synthesize custom morning audio scripts from raw price and news data.
              To eliminate hallucinations and prevent misleading commentary, our pipeline enforces strict guardrails:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-bright font-medium">Closed-Context Prompting:</strong> The LLM is strictly instructed to explain movements using only the verified news headlines and data provided in its input payload. It cannot synthesize or invent external narrative context.</li>
              <li><strong className="text-bright font-medium">Anti-Advisory Constraints:</strong> The system prompt strictly prohibits any phrase resembling trading advice, price targets, buy/sell recommendations, or stop-loss guidelines.</li>
              <li><strong className="text-bright font-medium">Fallback Mechanisms:</strong> If a stock has no meaningful news or corporate actions overnight, the script acknowledges normal market drift rather than hallucinating an explanation.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-4 border-t border-line-soft pt-10">
            <h2 className="font-serif text-2xl text-bright">4. Corrections & Errata Policy</h2>
            <p>
              We take accuracy seriously. Despite rigorous validation, market feeds may occasionally exhibit latency or corporate filings may undergo revision.
            </p>
            <p>
              If a subscriber or market participant notices any error in ticker attribution, percentage calculation, or news context:
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Notify us at <a href={`mailto:${site.email}`} className="text-bright underline hover:text-dawn">{site.email}</a> with the subject line <em>&quot;Data Correction: [Ticker]&quot;</em>.</li>
              <li>Our engineering team verifies the discrepancy against official exchange bhavcopies and corporate feeds within 24 hours.</li>
              <li>Any systemic data feed issues or pipeline prompt adjustments are implemented immediately to prevent recurrence.</li>
            </ol>
          </section>

          {/* Section 5: SEBI Disclosure */}
          <section id="sebi-disclosure" className="scroll-mt-20 rounded-xl border border-line-soft bg-surface/50 p-6 space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-dawn">Regulatory Notice</span>
            <h2 className="font-serif text-2xl text-bright">5. SEBI Regulatory Disclosure</h2>
            <p className="text-sm leading-relaxed text-muted">
              BriefCast is an automated technology platform providing algorithmic data aggregation for educational and informational purposes.
              BriefCast is not registered with the Securities and Exchange Board of India (SEBI) as an Investment Adviser (under SEBI IA Regulations, 2013)
              or as a Research Analyst (under SEBI RA Regulations, 2014).
            </p>
            <p className="text-sm leading-relaxed text-muted">
              Nothing communicated in our audio briefs, website copy, or Telegram bot messages constitutes personal investment advice, financial planning,
              portfolio management, or a solicitation to trade securities. Trading in the Indian stock market involves substantial financial risk, including loss of principal.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
