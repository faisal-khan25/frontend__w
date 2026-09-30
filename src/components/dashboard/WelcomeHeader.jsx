function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function WelcomeHeader({ user }) {
  const today = new Date();
  const dateLabel = today.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="card card-pad flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">
          {getGreeting()}, {user?.name?.split(" ")[0] || "there"} 👋
        </h1>
        <p className="text-muted mt-1">{dateLabel}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {user?.role && <span className="badge-primary">{user.role}</span>}
        {user?.department && <span className="badge-sky">{user.department}</span>}
      </div>
    </div>
  );
}
