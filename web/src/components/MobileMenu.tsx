"use client";

// The only stateful piece of the nav: below md the section links collapse into
// this toggle. Closes on link tap, Escape, or a tap outside the panel.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import TelegramButton from "./TelegramButton";

type NavLink = { href: string; label: string };

export default function MobileMenu({ links }: { links: readonly NavLink[] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="md:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-full text-bright transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dawn"
      >
        <svg viewBox="0 0 20 20" aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
          {open ? (
            <path d="M5 5l10 10M15 5L5 15" />
          ) : (
            <path d="M3 6h14M3 10h14M3 14h14" />
          )}
        </svg>
      </button>

      <div
        id="mobile-menu"
        hidden={!open}
        // Opaque, not blurred: the header already has backdrop-filter, and a
        // nested one can't see past it, so a translucent panel shows the hero through.
        className="absolute inset-x-0 top-16 border-b border-line bg-ink shadow-[0_24px_48px_-24px_rgba(0,0,0,0.9)]"
      >
        <ul className="mx-auto max-w-6xl px-5 py-3 sm:px-8">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                className="block py-3.5 text-[0.95rem] text-muted transition-colors hover:text-bright"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        {/* Only when the bar's own "Start free" is hidden (below 360px) */}
        <div className="mx-auto max-w-6xl px-5 pb-5 min-[360px]:hidden sm:px-8">
          <TelegramButton className="w-full">Start free on Telegram</TelegramButton>
        </div>
      </div>
    </div>
  );
}
