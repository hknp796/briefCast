export default function WhyBriefcast() {
  return (
    <section id="why" className="scroll-mt-20 border-t border-line-soft bg-surface/20">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <div className="max-w-3xl">
          <p className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-dawn">
            Pre-Market Preparation
          </p>
          <h2 className="mt-4 font-serif text-4xl leading-[1.1] tracking-[-0.02em] sm:text-5xl">
            Why three minutes of focused audio beats forty-five minutes of morning noise.
          </h2>
          <p className="mt-5 text-[1.02rem] leading-relaxed text-muted">
            Most Indian retail traders start their morning overwhelmed: scrolling conflicting Twitter threads,
            sifting through noisy Telegram tip channels, and skimming generic Nifty 50 market recaps that do not
            even mention their holdings. BriefCast changes how you prepare for the 9:15 AM open with a calm,
            personalized audio briefing built solely around your personal watchlist.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          <div className="rounded-2xl border border-line bg-surface p-7 sm:p-8">
            <div className="mb-4 font-mono text-[0.75rem] text-dawn-soft">01 / Focus</div>
            <h3 className="text-lg font-medium tracking-tight text-bright">
              Zero Irrelevant Noise
            </h3>
            <p className="mt-3 text-[0.92rem] leading-relaxed text-muted">
              Generic financial morning shows cover 50 benchmark stocks you may not own. BriefCast
              filters out everything except the specific NSE tickers on your watchlist, ensuring every
              second of spoken audio is directly relevant to your active portfolio and trading capital.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-7 sm:p-8">
            <div className="mb-4 font-mono text-[0.75rem] text-dawn-soft">02 / Context</div>
            <h3 className="text-lg font-medium tracking-tight text-bright">
              The Driver Behind the Gap
            </h3>
            <p className="mt-3 text-[0.92rem] leading-relaxed text-muted">
              A pre-market tick showing a stock gapping up 2% is useless without context. BriefCast connects
              price movement to the underlying catalyst—overnight US ADR moves, regulatory clearances, quarterly
              earnings surprises, or corporate filings—so you enter the session knowing why it moved.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-7 sm:p-8">
            <div className="mb-4 font-mono text-[0.75rem] text-dawn-soft">03 / Routine</div>
            <h3 className="text-lg font-medium tracking-tight text-bright">
              Hands-Free Morning Prep
            </h3>
            <p className="mt-3 text-[0.92rem] leading-relaxed text-muted">
              Trading requires mental clarity, not screen fatigue before the bell even rings. Listen to your
              brief on Telegram while making breakfast, exercising, or during your morning commute. Arrive at
              your trading desk at 9:15 AM grounded, informed, and ahead of the crowd.
            </p>
          </div>
        </div>

        <div className="mt-12 rounded-2xl border border-line bg-surface-2/60 p-7 sm:p-8">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h4 className="text-base font-medium text-bright">
                Comprehensive NSE Equities Coverage
              </h4>
              <p className="mt-1.5 text-[0.9rem] leading-relaxed text-muted">
                Track any stock listed on the National Stock Exchange of India. From Nifty 50 bellwethers
                like Reliance and Infosys to high-growth midcaps and emerging smallcaps, BriefCast monitors
                overnight price developments, exchange disclosures, and corporate news for every symbol you name.
              </p>
            </div>
            <span className="font-mono text-[0.75rem] uppercase tracking-wider text-dawn">
              NSE Cash Equities
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
