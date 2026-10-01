import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy — BriefCast",
  description:
    "BriefCast values your privacy. Learn how we handle your Telegram data, watchlist selections, and comply with India's DPDP Act.",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-4xl px-5 py-16 sm:px-8 sm:py-24">
        {/* Breadcrumb & Meta */}
        <div className="flex items-center gap-2 text-xs font-mono text-faint">
          <Link href="/" className="hover:text-bright transition-colors">Home</Link>
          <span>/</span>
          <span className="text-dawn">Privacy Policy</span>
        </div>

        {/* Title */}
        <h1 className="mt-6 font-serif text-4xl leading-[1.1] tracking-[-0.02em] sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-[0.88rem] text-faint">
          Effective Date: January 1, 2025 · Last updated: October 2026 · Operating from Calicut, Kerala, India
        </p>

        <div className="mt-10 space-y-10 text-[0.96rem] leading-relaxed text-muted">
          <p>
            At <strong className="text-bright font-medium">{site.name}</strong>, accessible via {site.url} and the Telegram bot @briefcast_market_bot,
            protecting user privacy is central to our philosophy. This Privacy Policy outlines what information we collect, how it is processed,
            and your rights under the <strong className="text-bright font-medium">Digital Personal Data Protection Act, 2023 (DPDP Act, India)</strong>.
          </p>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl text-bright">1. Information We Collect</h2>
            <p>
              BriefCast is engineered to operate with minimal data footprint. Because the service functions through Telegram, we do not require email signups, passwords, or traditional accounts.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-bright font-medium">Telegram Identifier:</strong> Your Telegram numeric user ID and chat ID, necessary solely to dispatch your morning audio brief.</li>
              <li><strong className="text-bright font-medium">Watchlist Preferences:</strong> The NSE stock symbols you choose to track using <code className="text-bright font-mono text-xs">/add</code> or <code className="text-bright font-mono text-xs">/remove</code>.</li>
              <li><strong className="text-bright font-medium">Configuration Settings:</strong> Your language choice (English or Hinglish) and preferred delivery time (e.g. 8:00 AM IST).</li>
            </ul>
          </section>

          <section className="space-y-4 border-t border-line-soft pt-10">
            <h2 className="font-serif text-2xl text-bright">2. What We Never Access or Collect</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>We <strong className="text-bright">never</strong> request brokerage credentials, API trading keys, demat details, or bank account numbers.</li>
              <li>We <strong className="text-bright">never</strong> monitor your actual trading activity, trade executions, portfolio size, or profits/losses.</li>
              <li>We <strong className="text-bright">never</strong> sell, rent, or trade user data or watchlist preferences to third-party marketers, advertisers, or stock-tipping channels.</li>
            </ul>
          </section>

          <section className="space-y-4 border-t border-line-soft pt-10">
            <h2 className="font-serif text-2xl text-bright">3. Data Storage & Infrastructure Providers</h2>
            <p>
              Data is managed through enterprise-grade infrastructure adhering to strict security protocols:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-bright font-medium">Supabase (PostgreSQL):</strong> Encrypted database holding user identifiers, watchlists, and delivery logs. Protected by Row-Level Security (RLS).</li>
              <li><strong className="text-bright font-medium">Telegram Bot API:</strong> Utilized for outbound dispatch of audio briefs and inbound user commands.</li>
              <li><strong className="text-bright font-medium">Vercel Web Analytics:</strong> Privacy-focused web analytics that do not use cookies or persist personal cross-site tracking profiles.</li>
            </ul>
          </section>

          <section className="space-y-4 border-t border-line-soft pt-10">
            <h2 className="font-serif text-2xl text-bright">4. User Rights & Data Deletion</h2>
            <p>
              You maintain total control over your data:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-bright font-medium">Instant Opt-Out:</strong> Sending the <code className="text-bright font-mono text-xs">/stop</code> command immediately pauses all pipeline generation and message delivery.</li>
              <li><strong className="text-bright font-medium">Right to Erasure:</strong> You can request complete erasure of your chat ID and watchlist history from our database at any time by messaging <a href={`mailto:${site.email}`} className="text-bright underline hover:text-dawn">{site.email}</a>. Requests are completed within 48 hours.</li>
            </ul>
          </section>

          <section className="space-y-4 border-t border-line-soft pt-10">
            <h2 className="font-serif text-2xl text-bright">5. Data Protection Officer & Jurisdiction</h2>
            <p>
              BriefCast is governed by the laws of India. For privacy inquiries or grievances, contact our compliance officer:
            </p>
            <div className="font-mono text-sm text-faint border-l-2 border-dawn pl-4 space-y-1">
              <p className="text-bright">Attn: Privacy & Data Officer ({site.author.name})</p>
              <p>Email: {site.email}</p>
              <p>Location: Calicut, Kerala, India</p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
