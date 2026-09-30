export default function FeatureSection({
  id,
  eyebrow,
  title,
  description,
  features,
  inverted = false,
}) {
  const wrapClass = inverted ? "bg-primary-50/40" : "bg-canvas";

  return (
    <section id={id} className={`${wrapClass} relative`}>
      <div className="container-page section">
        <div className="max-w-lg mb-14">
          <span className="eyebrow">{eyebrow}</span>
          <h2 className="section-title mt-3 mb-3">{title}</h2>
          <p className="section-desc">{description}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="card card-hover card-pad">
                <div className="h-11 w-11 rounded-xl bg-primary-50 flex items-center justify-center mb-5">
                  <Icon size={20} className="text-primary-600" strokeWidth={1.75} />
                </div>
                <h3 className="font-semibold mb-2 text-ink">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
