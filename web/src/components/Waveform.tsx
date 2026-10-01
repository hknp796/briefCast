"use client";

// 36 bars, deterministic (no Math.random) so SSR and client agree.
const BARS = Array.from({ length: 36 }, (_, i) =>
  0.3 + 0.34 * Math.abs(Math.sin(i * 0.7)) + 0.3 * Math.abs(Math.sin(i * 0.23 + 1.1))
);

export default function Waveform() {
  return (
    <div aria-hidden="true" className="flex h-9 flex-1 items-center justify-between gap-1">
      {BARS.map((h, i) => (
        <span
          key={i}
          className="wave-bar w-[3px] shrink-0 rounded-full bg-dawn/50"
          style={{ height: `${Math.round(h * 100)}%`, animationDelay: `${(i % 12) * 0.1}s` }}
        />
      ))}
    </div>
  );
}
