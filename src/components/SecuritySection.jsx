import { KeyRound, ShieldCheck, Lock, ScrollText, ShieldAlert, Gauge } from "lucide-react";

const controls = [
  { icon: KeyRound, label: "JWT + refresh tokens" },
  { icon: Lock, label: "Two-factor auth" },
  { icon: ShieldCheck, label: "Role-based access" },
  { icon: ScrollText, label: "Audit logs" },
  { icon: ShieldAlert, label: "CSRF protection" },
  { icon: Gauge, label: "Rate limiting" },
];

export default function SecuritySection() {
  return (
    <section id="security" className="bg-surface border-y border-line">
      <div className="container-page py-16">
        <span className="eyebrow">Security</span>
        <h2 className="section-title mt-3 mb-6 text-2xl sm:text-3xl">
          Enterprise controls, on by default
        </h2>
        <div className="flex flex-wrap gap-2.5">
          {controls.map((s) => {
            const Icon = s.icon;
            return (
              <span
                key={s.label}
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-canvas px-3.5 py-2 text-xs font-semibold text-muted"
              >
                <Icon size={14} className="text-primary-600" strokeWidth={1.75} />
                {s.label}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
