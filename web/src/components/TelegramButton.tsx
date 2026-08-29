import Link from "next/link";
import { BOT_URL } from "@/lib/site";

function TelegramGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M21.94 4.3 18.9 19.1c-.23 1.02-.84 1.27-1.7.79l-4.7-3.46-2.27 2.18c-.25.25-.46.46-.94.46l.34-4.78 8.7-7.86c.38-.34-.08-.53-.59-.19L6.1 12.98l-4.63-1.45c-1-.31-1.03-1 .21-1.49l18.1-6.98c.84-.3 1.57.2 1.16 3.24z" />
    </svg>
  );
}

type Props = {
  children?: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
};

/** Every conversion path on the page ends here: the live Telegram bot. */
export default function TelegramButton({
  children = "Start on Telegram",
  variant = "primary",
  className = "",
}: Props) {
  const base =
    "group inline-flex items-center justify-center gap-2.5 rounded-full px-6 py-3.5 " +
    "text-[0.95rem] font-medium tracking-tight transition-all duration-200 " +
    "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-dawn";

  const styles =
    variant === "primary"
      ? "bg-dawn text-[#16120b] hover:bg-dawn-soft shadow-[0_0_0_1px_rgba(247,164,60,0.4),0_8px_30px_-8px_rgba(247,164,60,0.55)] hover:shadow-[0_0_0_1px_rgba(247,164,60,0.6),0_10px_36px_-8px_rgba(247,164,60,0.7)]"
      : "border border-line bg-surface/60 text-bright hover:border-faint hover:bg-surface-2";

  return (
    <Link href={BOT_URL} target="_blank" rel="noopener noreferrer" className={`${base} ${styles} ${className}`}>
      <TelegramGlyph className="h-[1.05rem] w-[1.05rem] transition-transform duration-200 group-hover:translate-x-0.5" />
      {children}
    </Link>
  );
}
