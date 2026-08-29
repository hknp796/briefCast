import { plans } from "@/lib/site";
import TelegramButton from "./TelegramButton";

function Check() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className="mt-[0.3rem] h-3 w-3 shrink-0 text-dawn" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 8.5 6 12l7.5-8" />
    </svg>
  );
}

export default function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 border-t border-line-soft bg-surface/30">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <div className="max-w-2xl">
          <h2 className="font-serif text-4xl leading-[1.1] tracking-[-0.02em] sm:text-5xl">
            Cheaper than one bad morning.
          </h2>
          <p className="mt-5 text-[1.02rem] leading-relaxed text-muted">
            Start free and keep it free. Upgrade when your watchlist outgrows it.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.id}
              className={
                "relative flex flex-col rounded-2xl border p-7 sm:p-8 " +
                (p.featured
                  ? "border-dawn/45 bg-surface shadow-[0_0_60px_-25px_rgba(247,164,60,0.5)]"
                  : "border-line bg-surface/60")
              }
            >
              {p.featured && (
                <span className="absolute -top-2.5 left-8 rounded-full bg-dawn px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-[#16120b]">
                  Most popular
                </span>
              )}

              <h3 className="text-[1.05rem] font-medium tracking-tight">{p.name}</h3>
              <p className="mt-1.5 text-[0.9rem] text-muted">{p.pitch}</p>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-serif text-5xl tracking-tight">{p.price}</span>
                <span className="text-[0.85rem] text-faint">{p.cadence}</span>
              </div>

              <ul className="mt-7 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2.5 text-[0.92rem] leading-relaxed text-muted">
                    <Check />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 pt-1">
                <TelegramButton
                  variant={p.featured ? "primary" : "secondary"}
                  className="w-full"
                >
                  {p.cta}
                </TelegramButton>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-[0.82rem] leading-relaxed text-faint">
          Paid plans bill in INR. Prices shown are launch pricing and may change.
        </p>
      </div>
    </section>
  );
}
