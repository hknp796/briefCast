import Link from "next/link";
import { BOT_URL, site } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-line-soft bg-surface/40">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-5 w-5 items-end justify-center overflow-hidden">
                <span className="h-2.5 w-5 rounded-t-full bg-dawn" />
                <span className="absolute bottom-0 h-px w-5 bg-dawn-deep" />
              </span>
              <span className="font-semibold tracking-tight">{site.name}</span>
            </div>
            <p className="mt-3 max-w-xs text-[0.85rem] leading-relaxed text-faint">
              Personalised audio market briefs for Indian retail traders.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-8 gap-y-3 text-[0.88rem]">
            <Link href="#how" className="text-muted transition-colors hover:text-bright">How it works</Link>
            <Link href="#sample" className="text-muted transition-colors hover:text-bright">Sample brief</Link>
            <Link href="#pricing" className="text-muted transition-colors hover:text-bright">Pricing</Link>
            <Link href="#faq" className="text-muted transition-colors hover:text-bright">FAQ</Link>
            <Link href={BOT_URL} target="_blank" rel="noopener noreferrer" className="text-muted transition-colors hover:text-bright">Telegram</Link>
          </nav>
        </div>

        {/* Required posture for anything market-adjacent in India — BriefCast
            reports, it does not recommend. Keep this visible. */}
        <div className="mt-12 border-t border-line-soft pt-7">
          <p className="max-w-3xl text-[0.78rem] leading-relaxed text-faint">
            BriefCast provides general market information for educational purposes only. It is not
            investment advice, and it is not a SEBI-registered investment adviser or research
            analyst. Nothing here is a recommendation to buy, sell or hold any security. Market
            data and news are drawn from public sources and may be delayed or incomplete. Investing
            in securities carries risk, including loss of capital. Do your own research.
          </p>
          <p className="mt-6 text-[0.78rem] text-faint">
            © {new Date().getFullYear()} {site.name}. Made in India.
          </p>
        </div>
      </div>
    </footer>
  );
}
