import Link from "next/link";
import { BOT_URL, site } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-line-soft bg-surface/40">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand & Author / Location signal */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-5 w-5 items-end justify-center overflow-hidden">
                <span className="h-2.5 w-5 rounded-t-full bg-dawn" />
                <span className="absolute bottom-0 h-px w-5 bg-dawn-deep" />
              </span>
              <span className="font-semibold tracking-tight">{site.name}</span>
            </div>
            <p className="mt-3 max-w-sm text-[0.85rem] leading-relaxed text-muted">
              Personalised 3-minute audio market briefs for Indian retail traders,
              delivered on Telegram before the NSE opening bell.
            </p>
            <div className="mt-4 flex flex-col gap-1 text-[0.8rem] text-faint">
              <p>
                Built by <span className="font-medium text-bright">{site.author.name}</span> · {site.author.role}
              </p>
              <p>📍 {site.location}</p>
              <p>
                Contact:{" "}
                <a
                  href={`mailto:${site.email}`}
                  className="text-muted underline decoration-line-soft transition-colors hover:text-bright"
                >
                  {site.email}
                </a>
              </p>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-bright">Product</h4>
            <ul className="mt-4 space-y-2.5 text-[0.85rem]">
              <li>
                <Link href="/#why" className="text-muted transition-colors hover:text-bright">Why BriefCast</Link>
              </li>
              <li>
                <Link href="/#how" className="text-muted transition-colors hover:text-bright">How it works</Link>
              </li>
              <li>
                <Link href="/#sample" className="text-muted transition-colors hover:text-bright">Sample brief</Link>
              </li>
              <li>
                <Link href="/#pricing" className="text-muted transition-colors hover:text-bright">Pricing</Link>
              </li>
              <li>
                <Link href="/#faq" className="text-muted transition-colors hover:text-bright">FAQ</Link>
              </li>
            </ul>
          </div>

          {/* Company & Trust Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-bright">Company & Trust</h4>
            <ul className="mt-4 space-y-2.5 text-[0.85rem]">
              <li>
                <Link href="/about" className="text-muted transition-colors hover:text-bright">About Us</Link>
              </li>
              <li>
                <Link href="/editorial-policy" className="text-muted transition-colors hover:text-bright">Editorial Policy</Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted transition-colors hover:text-bright">Contact & Support</Link>
              </li>
              <li>
                <a href={BOT_URL} target="_blank" rel="noopener noreferrer" className="text-muted transition-colors hover:text-bright">
                  Telegram Bot
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-bright">Legal</h4>
            <ul className="mt-4 space-y-2.5 text-[0.85rem]">
              <li>
                <Link href="/privacy" className="text-muted transition-colors hover:text-bright">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted transition-colors hover:text-bright">Terms of Service</Link>
              </li>
              <li>
                <Link href="/editorial-policy#sebi-disclosure" className="text-muted transition-colors hover:text-bright">SEBI Disclosure</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Required posture for anything market-adjacent in India */}
        <div className="mt-12 border-t border-line-soft pt-7">
          <p className="max-w-4xl text-[0.78rem] leading-relaxed text-faint">
            BriefCast provides general market information for educational purposes only. It is not
            investment advice, and it is not a SEBI-registered investment adviser or research
            analyst. Nothing here is a recommendation to buy, sell or hold any security. Market
            data and news are drawn from public sources and may be delayed or incomplete. Investing
            in securities carries risk, including loss of capital. Do your own research.
          </p>
          <div className="mt-6 flex flex-col gap-2 text-[0.78rem] text-faint sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} {site.name}. All rights reserved. Made in Calicut, Kerala, India.</p>
            <p>Last updated: October 2026</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
