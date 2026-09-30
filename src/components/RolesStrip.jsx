const roles = ["Super admin", "Company admin", "HR", "Manager", "Team lead", "Employee", "Recruiter"];

export default function RolesStrip() {
  return (
    <section className="bg-surface border-b border-line">
      <div className="container-page py-16">
        <span className="eyebrow">One platform, every role</span>
        <h2 className="section-title mt-3 mb-6 text-2xl sm:text-3xl">
          A dashboard built for what each person actually does
        </h2>
        <div className="flex flex-wrap gap-2.5">
          {roles.map((r) => (
            <span key={r} className="pill">
              {r}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
