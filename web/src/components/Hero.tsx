import Link from "next/link";
import TelegramButton from "./TelegramButton";
import ChatMock from "./ChatMock";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Horizon glow — the sun coming up under the fold */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -bottom-40 h-[32rem] opacity-70"
        style={{
          background:
            "radial-gradient(60% 100% at 50% 100%, rgba(247,164,60,0.16), transparent 70%)",
        }}
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:py-28">
        <div>
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2.5 rounded-full border border-line bg-surface/70 px-3.5 py-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-dawn opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-dawn" />
            </span>
            <span className="text-[0.78rem] tracking-tight text-muted">
              Every trading day, before the 9:15 open
            </span>
          </div>

          <h1 className="mt-7 font-serif text-[2.7rem] leading-[1.06] tracking-[-0.02em] sm:text-6xl lg:text-[4.1rem]">
            Your watchlist,
            <br />
            <span className="text-dawn">read to you</span> before
            <br />
            the market opens.
          </h1>

          <p className="mt-7 max-w-xl text-[1.05rem] leading-relaxed text-muted">
            BriefCast turns overnight price moves and news on <em className="not-italic text-bright">your</em> stocks
            into a three-minute audio brief. It lands in Telegram while you&rsquo;re still making
            chai — so you walk into the open already knowing why things moved.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <TelegramButton />
            <Link
              href="#sample"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-surface/60 px-6 py-3.5 text-[0.95rem] font-medium tracking-tight text-bright transition-colors hover:border-faint hover:bg-surface-2"
            >
              Read a real brief
            </Link>
          </div>

          <p className="mt-6 text-[0.82rem] text-faint">
            Free to start · No app to install · Nothing to log into
          </p>
        </div>

        <ChatMock />
      </div>
    </section>
  );
}
