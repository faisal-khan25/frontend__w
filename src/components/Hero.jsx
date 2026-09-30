const statusTiles = [
  { label: "Clocked in", count: 128, tone: "mint" },
  { label: "On leave", count: 6, tone: "amber" },
  { label: "On break", count: 14, tone: "sky" },
  { label: "Not clocked in", count: 5, tone: "coral" },
];

const toneClasses = {
  mint: "bg-mint-bg text-mint border-mint/25",
  amber: "bg-amber-bg text-amber border-amber/25",
  sky: "bg-sky-bg text-sky border-sky/25",
  coral: "bg-coral-bg text-coral border-coral/25",
};

const avatarColors = ["bg-primary-200", "bg-mint-bg", "bg-sky-bg", "bg-amber-bg"];

function AttendancePreview() {
  return (
    <div className="relative animate-fadeUp">
      <div className="absolute -inset-4 bg-primary-100/60 rounded-panel blur-2xl -z-10" />
      <div className="card shadow-card-lg rounded-panel overflow-hidden animate-floaty">
        <div className="px-6 py-5 border-b border-line flex items-center justify-between bg-primary-50/50">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-mint" />
            <span className="text-sm font-semibold text-ink">Live · Acme Corp</span>
          </div>
          <span className="text-xs font-semibold text-primary-600">Today, 9:41 AM</span>
        </div>

        <div className="p-6 grid grid-cols-2 gap-3">
          {statusTiles.map((tile) => (
            <div
              key={tile.label}
              className={`rounded-2xl border px-4 py-3.5 ${toneClasses[tile.tone]}`}
            >
              <p className="text-2xl font-extrabold leading-none">{tile.count}</p>
              <p className="text-xs font-semibold mt-1.5 opacity-80">{tile.label}</p>
            </div>
          ))}
        </div>

        <div className="px-6 pb-6 flex items-center justify-between">
          <div className="flex items-center">
            {avatarColors.map((c, i) => (
              <span
                key={i}
                className={`w-8 h-8 rounded-full ${c} border-2 border-white flex items-center justify-center text-[10px] font-bold text-primary-700 -ml-2 first:ml-0`}
              >
                {String.fromCharCode(65 + i)}
              </span>
            ))}
            <span className="ml-3 text-xs font-medium text-muted">+214 employees</span>
          </div>
          <span className="badge-primary">All synced</span>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-canvas">
      <div className="absolute top-[-120px] right-[-100px] w-[420px] h-[420px] bg-primary-100 rounded-full blur-3xl opacity-70 pointer-events-none" />
      <div className="container-page relative pt-16 pb-20 sm:pt-24 sm:pb-28 grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <span className="eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Enterprise workplace OS
          </span>

          <h1 className="font-display text-4xl sm:text-5xl leading-[1.08] font-extrabold mt-5 mb-6 text-ink tracking-tight">
            Every tool your company runs on.
            <br />
            <span className="text-primary">One login away.</span>
          </h1>

          <p className="text-muted text-lg leading-relaxed mb-9 max-w-md">
            Chat, meetings, drive, docs, projects, and a complete HRMS — replacing the six
            tabs your team keeps open with the one they'll actually use.
          </p>

          <div className="flex flex-wrap gap-3 mb-10">
            <a href="/register" className="btn-primary">
              Get started free
            </a>
            <a href="#workspace" className="btn-outline">
              See how it works
            </a>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-faint">
            <span>SOC-2 ready</span>
            <span className="text-line">·</span>
            <span>RBAC + 2FA</span>
            <span className="text-line">·</span>
            <span>Self-hosted or cloud</span>
          </div>
        </div>

        <AttendancePreview />
      </div>
    </section>
  );
}
