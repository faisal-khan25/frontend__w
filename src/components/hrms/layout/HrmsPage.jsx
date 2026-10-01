export default function HrmsPage({ title, subtitle, children }) {
  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}