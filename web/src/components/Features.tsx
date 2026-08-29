const features = [
  {
    title: "Only your stocks",
    body:
      "Not the Nifty 50, not whatever's trending. The brief covers the symbols on your list and nothing else — which is why it stays under three minutes.",
  },
  {
    title: "The move and the reason",
    body:
      "Every gap is paired with the overnight headline that explains it. You get the what and the why together, not a number you then have to go research.",
  },
  {
    title: "English or Hinglish",
    body:
      "Switch with one command. Hinglish is written the way traders actually talk — stock names and numbers stay in English, the rest doesn't.",
  },
  {
    title: "Made for your ears",
    body:
      "Written to be spoken, not skimmed. Numbers are read out loud, sentences connect, and it plays while you're commuting or making breakfast.",
  },
  {
    title: "Ahead of the bell",
    body:
      "Generated overnight and delivered before 9:15am IST, so it's useful when you actually need it — not a recap you read at lunch.",
  },
  {
    title: "Information, never advice",
    body:
      "BriefCast tells you what happened and what to keep an eye on. It never tells you to buy or sell anything. That call stays yours.",
  },
];

export default function Features() {
  return (
    <section className="border-t border-line-soft">
      <div className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <h2 className="max-w-2xl font-serif text-4xl leading-[1.1] tracking-[-0.02em] sm:text-5xl">
          Built for the ten minutes before you open your terminal.
        </h2>

        <div className="mt-14 grid gap-x-12 gap-y-11 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title}>
              <div className="mb-4 h-px w-10 bg-dawn" />
              <h3 className="text-[1.05rem] font-medium tracking-tight">{f.title}</h3>
              <p className="mt-2.5 text-[0.95rem] leading-relaxed text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
