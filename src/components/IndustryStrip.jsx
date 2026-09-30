const industries = ["Manufacturing", "Finance", "Healthcare", "Retail", "Technology", "Logistics"];

export default function IndustryStrip() {
  return (
    <section className="relative border-y border-line bg-surface">
      <div className="container-page py-6 flex flex-wrap items-center justify-between gap-4">
        <span className="text-xs font-bold uppercase tracking-widest text-faint">Built for</span>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm font-medium text-muted">
          {industries.map((i) => (
            <span key={i} className="hover:text-primary-600 transition-colors cursor-default">
              {i}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
