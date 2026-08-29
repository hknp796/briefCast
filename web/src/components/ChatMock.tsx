// A faithful mock of what deliverBriefs.js actually sends: an audio message
// titled "BriefCast — Market Brief" with the good-morning caption, arriving
// before the open. Deterministic bar heights — no Math.random, so SSR and the
// client render identically.
const BARS = [
  0.35, 0.62, 0.44, 0.85, 0.55, 0.95, 0.7, 0.4, 0.78, 0.52, 0.88, 0.33,
  0.66, 0.92, 0.48, 0.74, 0.38, 0.6, 0.83, 0.45, 0.7, 0.55, 0.4, 0.65,
  0.9, 0.5, 0.36, 0.72, 0.58, 0.42,
];

export default function ChatMock() {
  return (
    <div className="relative">
      {/* Dawn bloom behind the phone */}
      <div
        aria-hidden
        className="absolute -inset-10 -z-10 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 50% 65%, rgba(247,164,60,0.28), transparent 65%)",
        }}
      />

      <div className="mx-auto w-full max-w-[340px] overflow-hidden rounded-[1.75rem] border border-line bg-surface shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
        {/* Chat header */}
        <div className="flex items-center gap-3 border-b border-line-soft bg-surface-2 px-4 py-3">
          <span className="relative flex h-9 w-9 items-end justify-center overflow-hidden rounded-full bg-[#1b1f27]">
            <span className="mb-2.5 h-2.5 w-5 rounded-t-full bg-dawn" />
            <span className="absolute bottom-2.5 h-px w-5 bg-dawn-deep" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-medium">BriefCast</p>
            <p className="text-[0.7rem] text-faint">bot</p>
          </div>
        </div>

        {/* Message stream */}
        <div className="space-y-2.5 px-3.5 py-5">
          {/* Audio message */}
          <div className="max-w-[92%] rounded-2xl rounded-tl-md bg-surface-2 p-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-dawn text-[#16120b]">
                <svg viewBox="0 0 24 24" aria-hidden className="ml-0.5 h-4 w-4" fill="currentColor">
                  <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.3-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14z" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.82rem] font-medium">BriefCast — Market Brief</p>
                <p className="text-[0.7rem] text-faint">BriefCast</p>
              </div>
            </div>

            {/* Waveform */}
            <div className="mt-3 flex h-8 items-center gap-[3px]">
              {BARS.map((h, i) => (
                <span
                  key={i}
                  className="wave-bar w-[3px] shrink-0 rounded-full bg-dawn/70"
                  style={{
                    height: `${Math.round(h * 100)}%`,
                    animationDelay: `${(i % 10) * 0.11}s`,
                  }}
                />
              ))}
              <span className="ml-auto shrink-0 font-mono text-[0.7rem] text-faint">2:47</span>
            </div>

            <p className="mt-3 text-[0.82rem] leading-relaxed text-muted">
              Good morning Arjun ☀️ Your market brief is ready.
            </p>
            <p className="mt-1.5 text-right font-mono text-[0.65rem] text-faint">8:00</p>
          </div>

          {/* User reply — shows the bot is two-way */}
          <div className="ml-auto max-w-[75%] rounded-2xl rounded-br-md bg-[#2b2214] px-3.5 py-2.5">
            <p className="font-mono text-[0.82rem] text-dawn-soft">/add TATAMOTORS</p>
            <p className="mt-1 text-right font-mono text-[0.65rem] text-faint">8:04</p>
          </div>

          <div className="max-w-[75%] rounded-2xl rounded-tl-md bg-surface-2 px-3.5 py-2.5">
            <p className="text-[0.82rem] text-muted">✅ Added TATAMOTORS to your watchlist.</p>
            <p className="mt-1 text-right font-mono text-[0.65rem] text-faint">8:04</p>
          </div>
        </div>
      </div>
    </div>
  );
}
