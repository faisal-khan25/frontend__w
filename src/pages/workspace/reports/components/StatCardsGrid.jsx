const TONE_CLASS = {
  primary: "bg-primary-50 text-primary-600",
  amber: "bg-amber-bg text-amber",
  coral: "bg-coral-bg text-coral",
  mint: "bg-mint-bg text-mint",
  sky: "bg-sky-bg text-sky",
  violet: "bg-violet-bg text-violet",
};

export default function StatCardsGrid({ cards }) {
  if (!cards || cards.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.key} className="card card-pad">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${TONE_CLASS[c.tone] || TONE_CLASS.primary}`}>
            <c.icon size={17} />
          </div>
          <p className="text-2xl font-display font-bold text-ink">{c.value ?? "—"}</p>
          <p className="text-xs text-muted mt-0.5">{c.label}</p>
          {c.sub && <p className="text-[11px] text-faint mt-0.5">{c.sub}</p>}
        </div>
      ))}
    </div>
  );
}
