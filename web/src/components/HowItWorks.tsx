import TelegramButton from "./TelegramButton";

const steps = [
  {
    n: "01",
    cmd: "/start",
    title: "Open the bot",
    body:
      "One tap in Telegram. No email, no password, no app download — your Telegram account is your account.",
  },
  {
    n: "02",
    cmd: "/add RELIANCE",
    title: "Name your stocks",
    body:
      "Add NSE symbols one at a time. Change them whenever you like with /list and /remove. Set Hinglish with /language.",
  },
  {
    n: "03",
    cmd: "8:00am",
    title: "Wake up briefed",
    body:
      "While you sleep, BriefCast reads the overnight tape and the news, writes your brief, and speaks it. It's waiting when you wake.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-20 border-t border-line-soft bg-surface/30">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <h2 className="max-w-2xl font-serif text-4xl leading-[1.1] tracking-[-0.02em] sm:text-5xl">
          Three messages to set up. Then never again.
        </h2>

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="flex flex-col bg-ink p-7 sm:p-8">
              <span className="font-mono text-[0.72rem] tracking-[0.16em] text-dawn">{s.n}</span>
              <code className="mt-5 inline-flex w-fit rounded-lg border border-line bg-surface-2 px-3 py-1.5 font-mono text-[0.85rem] text-dawn-soft">
                {s.cmd}
              </code>
              <h3 className="mt-5 text-lg font-medium tracking-tight">{s.title}</h3>
              <p className="mt-2.5 text-[0.95rem] leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <TelegramButton>Set it up now — it takes a minute</TelegramButton>
        </div>
      </div>
    </section>
  );
}
