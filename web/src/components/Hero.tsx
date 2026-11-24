import Link from "next/link";
import TelegramButton from "./TelegramButton";
import ChatMock from "./ChatMock";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Faint grid, faded out toward the edges */}
      <div aria-hidden className="hero-grid pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-6xl px-5 pt-20 text-center sm:px-8 sm:pt-28">
        <p className="inline-flex items-center gap-2 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-dawn">
          <span aria-hidden className="relative flex h-2.5 w-4 items-end justify-center overflow-hidden">
            <span className="h-2 w-4 rounded-t-full bg-dawn" />
          </span>
          Before the 9:15 open
        </p>

        <h1 className="mx-auto mt-6 max-w-4xl text-balance font-display text-[2.5rem] font-medium leading-[1.05] tracking-[-0.035em] sm:text-6xl lg:text-[4.25rem]">
          Your watchlist, read to you
          <br className="hidden sm:block" /> before the market opens
        </h1>

        <p className="mx-auto mt-6 max-w-lg text-[1.05rem] leading-relaxed text-muted">
          A three-minute audio brief on the stocks you hold: what moved overnight
          and why. It arrives in Telegram every trading morning.
        </p>

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <TelegramButton />
          <Link
            href="#sample"
            className="inline-flex items-center justify-center rounded-full bg-surface-2 px-6 py-3.5 text-[0.95rem] font-medium text-bright transition-colors hover:bg-line"
          >
            Read a sample brief
          </Link>
        </div>

        <p className="mt-5 text-[0.82rem] text-faint">
          Free to start. No app to install.
        </p>

        <div className="relative mx-auto mt-16 sm:mt-20">
          {/* Sunrise glow, centred on the phone */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[45%] h-[40rem] w-[56rem] max-w-[150vw] -translate-x-1/2 -translate-y-1/2"
            style={{
              background:
                "radial-gradient(closest-side, rgba(247,164,60,0.26), rgba(247,164,60,0.07) 55%, transparent)",
            }}
          />
          <div className="relative">
            <ChatMock />
          </div>
        </div>
      </div>

      {/* Phone sinks into the next section instead of ending on a hard edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-ink"
      />
    </section>
  );
}
