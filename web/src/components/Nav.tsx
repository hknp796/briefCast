import Link from "next/link";
import TelegramButton from "./TelegramButton";
import { site } from "@/lib/site";

const links = [
  { href: "#how", label: "How it works" },
  { href: "#sample", label: "Sample brief" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export default function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-line-soft bg-ink/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          {/* Rising-sun mark: a half disc on the horizon line */}
          <span className="relative flex h-6 w-6 items-end justify-center overflow-hidden">
            <span className="h-3 w-6 rounded-t-full bg-dawn" />
            <span className="absolute bottom-0 h-px w-6 bg-dawn-deep" />
          </span>
          <span className="text-[1.05rem] font-semibold tracking-tight">{site.name}</span>
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="text-sm text-muted transition-colors hover:text-bright"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <TelegramButton className="!px-5 !py-2.5 !text-sm">Start free</TelegramButton>
      </nav>
    </header>
  );
}
