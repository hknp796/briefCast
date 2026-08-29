// The proof section. The transcript below follows the exact rules the system
// prompt in generateScripts.js enforces: 250-320 words, spoken numbers, no
// markdown, one "thing to watch", never a buy/sell call, closing disclaimer.

const WATCHLIST = [
  { ticker: "RELIANCE", gap: 1.2 },
  { ticker: "INFY", gap: -0.8 },
  { ticker: "TCS", gap: 0.1 },
  { ticker: "HDFCBANK", gap: 0.0 },
  { ticker: "TATAMOTORS", gap: -0.2 },
];

// 80 bars, deterministic (no Math.random) so SSR and client agree.
const BARS = Array.from({ length: 80 }, (_, i) =>
  0.3 + 0.34 * Math.abs(Math.sin(i * 0.7)) + 0.3 * Math.abs(Math.sin(i * 0.23 + 1.1))
);

function fmt(gap: number) {
  const sign = gap > 0 ? "+" : gap < 0 ? "" : "±";
  return `${sign}${gap.toFixed(1)}%`;
}

export default function SampleBrief() {
  return (
    <section id="sample" className="scroll-mt-20 border-t border-line-soft">
      <div className="mx-auto max-w-4xl px-5 py-24 sm:px-8">
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-dawn">
          Tuesday, 8:00am IST
        </p>
        <h2 className="mt-4 font-serif text-4xl leading-[1.1] tracking-[-0.02em] sm:text-5xl">
          This is what lands in your chat.
        </h2>
        <p className="mt-5 max-w-2xl text-[1.02rem] leading-relaxed text-muted">
          Not a newsletter you&rsquo;ll archive unread. Not a notification with a headline and no
          context. A short, spoken read of the five stocks this trader actually holds.
        </p>

        <div className="mt-12 overflow-hidden rounded-2xl border border-line bg-surface">
          {/* Watchlist strip — the inputs behind the brief */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line-soft bg-surface-2 px-6 py-4">
            <span className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-faint">
              Watchlist
            </span>
            {WATCHLIST.map((s) => (
              <span key={s.ticker} className="flex items-baseline gap-1.5 font-mono text-[0.8rem]">
                <span className="text-bright">{s.ticker}</span>
                <span className={s.gap > 0 ? "text-up" : s.gap < 0 ? "text-down" : "text-faint"}>
                  {fmt(s.gap)}
                </span>
              </span>
            ))}
          </div>

          {/* Player bar */}
          <div className="flex items-center gap-4 border-b border-line-soft px-6 py-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-dawn text-[#16120b]">
              <svg viewBox="0 0 24 24" aria-hidden className="ml-0.5 h-4 w-4" fill="currentColor">
                <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.3-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14z" />
              </svg>
            </span>
            <div className="flex h-9 flex-1 items-center justify-between">
              {BARS.map((h, i) => (
                <span
                  key={i}
                  className="wave-bar w-[2px] shrink-0 rounded-full bg-dawn/50"
                  style={{ height: `${Math.round(h * 100)}%`, animationDelay: `${(i % 12) * 0.1}s` }}
                />
              ))}
            </div>
            <span className="shrink-0 font-mono text-[0.75rem] text-faint">2:47</span>
          </div>

          {/* Transcript */}
          <div className="space-y-5 px-6 py-8 text-[1.02rem] leading-[1.75] text-muted sm:px-9 sm:py-10">
            <p>
              <span className="text-bright">Good morning, Arjun.</span> Quiet night across most of
              your list, but two names moved and both are worth a minute.
            </p>
            <p>
              Reliance is the big one. It closed yesterday at two thousand nine forty and opened up
              one point two percent. That gap is tracking an overnight report that the retail arm
              has cleared its last regulatory hurdle on the quick-commerce rollout — and volume in
              the opening minutes is running well above its ten-day average, so this is real
              participation, not a thin print.
            </p>
            <p>
              Infosys is the other side of the coin, down eight-tenths of a percent at the open.
              Nothing company-specific there — a large US peer trimmed full-year IT spending
              guidance overnight and the whole sector is trading in sympathy. Worth separating
              in your head from anything Infosys itself did.
            </p>
            <p>
              TCS, HDFC Bank and Tata Motors all opened effectively flat, with no material news
              overnight.
            </p>
            <p>
              <span className="text-bright">One thing to watch today:</span> Reliance has run into
              resistance around two thousand nine eighty twice this month. If today&rsquo;s move has
              legs, that&rsquo;s the level the tape will be watching.
            </p>
            <p className="border-t border-line-soft pt-5 text-[0.92rem] text-faint">
              This is for information only, and not financial advice.
            </p>
          </div>
        </div>

        <p className="mt-5 text-[0.82rem] leading-relaxed text-faint">
          Illustrative sample. Real briefs are generated fresh each morning from that
          day&rsquo;s overnight prices and news.
        </p>
      </div>
    </section>
  );
}
