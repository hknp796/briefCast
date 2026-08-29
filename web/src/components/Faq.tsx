import { BOT_USERNAME } from "@/lib/site";

const faqs = [
  {
    q: "Do I need to install anything?",
    a: "No. If you already have Telegram, that's the whole stack. BriefCast is a bot inside it — there's no BriefCast app, no website to log into, and no password to remember.",
  },
  {
    q: "Which stocks can I add?",
    a: "Anything listed on the NSE. Add the plain symbol without the .NS suffix — /add INFY, /add TATAMOTORS, /add M&M. If a symbol isn't recognised the bot tells you straight away.",
  },
  {
    q: "What time does it arrive?",
    a: "Before the 9:15am open, every trading day. The default is 8:00am IST and paid plans can set their own time with /time 07:00.",
  },
  {
    q: "Where does the information come from?",
    a: "Overnight and previous-session price data comes from public market data feeds. The context around each move comes from published news coverage on that stock, gathered fresh each night.",
  },
  {
    q: "Is this financial advice?",
    a: "No, and it's deliberately built not to be. BriefCast reports what moved and flags one thing worth watching. It will never tell you to buy, sell or hold, and it isn't a registered investment adviser. Every decision is yours.",
  },
  {
    q: "How do I stop?",
    a: "Message the bot and stop. There's no billing to unwind on the free plan, and paid plans cancel from the same chat. You can clear your watchlist any time with /remove.",
  },
];

export default function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 border-t border-line-soft">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="font-serif text-4xl leading-[1.1] tracking-[-0.02em] sm:text-5xl">
              Questions,
              <br />
              answered.
            </h2>
            <p className="mt-5 text-[0.95rem] leading-relaxed text-muted">
              Still stuck? Message{" "}
              <span className="font-mono text-dawn-soft">@{BOT_USERNAME}</span> and say hello.
            </p>
          </div>

          <div className="divide-y divide-line-soft border-t border-line-soft">
            {faqs.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-[1rem] font-medium tracking-tight marker:content-none">
                  {f.q}
                  <span className="mt-1 shrink-0 text-faint transition-transform duration-200 group-open:rotate-45">
                    <svg viewBox="0 0 16 16" aria-hidden className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M8 2v12M2 8h12" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl pr-10 text-[0.95rem] leading-relaxed text-muted">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
