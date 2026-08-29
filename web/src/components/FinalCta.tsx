import TelegramButton from "./TelegramButton";

export default function FinalCta() {
  return (
    <section className="relative overflow-hidden border-t border-line-soft">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-full"
        style={{
          background:
            "radial-gradient(70% 120% at 50% 120%, rgba(247,164,60,0.20), transparent 65%)",
        }}
      />
      <div className="relative mx-auto max-w-3xl px-5 py-28 text-center sm:px-8">
        <h2 className="font-serif text-4xl leading-[1.08] tracking-[-0.02em] sm:text-[3.4rem]">
          Tomorrow morning, be the one
          <br className="hidden sm:block" /> who already knows.
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-[1.02rem] leading-relaxed text-muted">
          Set it up tonight in under a minute. Your first brief arrives before the next open.
        </p>
        <div className="mt-9 flex justify-center">
          <TelegramButton className="!px-8 !py-4 !text-base" />
        </div>
        <p className="mt-6 font-mono text-[0.78rem] text-faint">@briefcast_market_bot</p>
      </div>
    </section>
  );
}
