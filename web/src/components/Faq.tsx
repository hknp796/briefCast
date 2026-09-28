import { BOT_USERNAME, faqs } from "@/lib/site";

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
