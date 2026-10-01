import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service — BriefCast",
  description:
    "Review the terms and conditions governing the use of the BriefCast pre-market briefing platform and Telegram bot service.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-24">
        {/* Breadcrumb & Meta */}
        <div className="flex items-center gap-2 text-xs font-mono text-faint">
          <Link href="/" className="hover:text-bright transition-colors">Home</Link>
          <span>/</span>
          <span className="text-dawn">Terms of Service</span>
        </div>

        {/* Title */}
        <h1 className="mt-6 font-serif text-4xl leading-[1.1] tracking-[-0.02em] sm:text-5xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-[0.88rem] text-faint">
          Effective Date: January 1, 2025 · Last updated: October 2026 · Operating from Calicut, Kerala, India
        </p>

        <div className="mt-10 space-y-10 text-[0.96rem] leading-relaxed text-muted">
          <p>
            By accessing or using <strong className="text-bright font-medium">{site.name}</strong> (via {site.url} or the Telegram bot),
            you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.
          </p>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl text-bright">1. Nature of Service: Educational & Informational Only</h2>
            <p>
              BriefCast is an automated market information technology tool. All audio briefs, scripts, percentages, and summaries
              are generated solely for educational and informational purposes.
            </p>
            <div className="rounded-lg border border-line bg-surface/50 p-4 text-sm text-bright">
              <strong className="text-dawn">Important:</strong> BriefCast is NOT an Investment Adviser or Research Analyst registered with SEBI.
              Nothing provided on this site or via Telegram constitutes financial advice, investment recommendations, or an offer to buy or sell securities.
            </div>
          </section>

          <section className="space-y-4 border-t border-line-soft pt-10">
            <h2 className="font-serif text-2xl text-bright">2. Assumption of Investment Risk & Limitation of Liability</h2>
            <p>
              Trading and investing in securities listed on the National Stock Exchange of India (NSE) or Bombay Stock Exchange (BSE) carries inherent market risks,
              including the complete loss of capital.
            </p>
            <p>
              BriefCast, its founder, and affiliates shall not be held liable for any trading losses, missed opportunities, financial damages,
              or decisions made based on the audio briefings. You assume 100% responsibility for your trading and investment decisions.
            </p>
          </section>

          <section className="space-y-4 border-t border-line-soft pt-10">
            <h2 className="font-serif text-2xl text-bright">3. Data Accuracy & Third-Party Outages</h2>
            <p>
              Market prices, ADR quotes, and news headlines are obtained from publicly accessible APIs, exchange bhavcopies, and news sources.
              While we enforce rigorous validation routines, data feeds may experience unexpected delays, latency, or revisions beyond our control.
              BriefCast provides all data on an &quot;as is&quot; and &quot;as available&quot; basis without warranties of any kind.
            </p>
          </section>

          <section className="space-y-4 border-t border-line-soft pt-10">
            <h2 className="font-serif text-2xl text-bright">4. Subscriptions, Upgrades & Cancellations</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-bright font-medium">Free Tier:</strong> Permitted for personal use tracking up to 5 tickers at standard delivery times.</li>
              <li><strong className="text-bright font-medium">Paid Subscriptions:</strong> Premium tiers (Pro, Trader) provide expanded watchlists, custom delivery timings, and Hinglish audio support.</li>
              <li><strong className="text-bright font-medium">Self-Service Cancellation:</strong> Users can cancel paid subscriptions at any time with immediate effect. No complicated phone calls or paperwork required.</li>
            </ul>
          </section>

          <section className="space-y-4 border-t border-line-soft pt-10">
            <h2 className="font-serif text-2xl text-bright">5. Acceptable Use Policy</h2>
            <p>
              Users agree not to reverse-engineer, mass-scrape, or exploit the Telegram bot interface. BriefCast audio files and scripts
              are generated for individual, personal use and may not be redistributed on commercial tip channels without express written consent.
            </p>
          </section>

          <section className="space-y-4 border-t border-line-soft pt-10">
            <h2 className="font-serif text-2xl text-bright">6. Governing Law & Dispute Resolution</h2>
            <p>
              These Terms shall be construed in accordance with and governed by the laws of India. Any legal dispute or controversy arising under
              these Terms shall be subject to the exclusive jurisdiction of the competent courts situated in Calicut (Kozhikode), Kerala, India.
            </p>
            <p className="text-sm text-faint">
              Questions regarding these Terms? Contact us at <a href={`mailto:${site.email}`} className="text-bright underline hover:text-dawn">{site.email}</a>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
