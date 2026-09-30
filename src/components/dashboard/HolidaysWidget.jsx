import { useEffect, useState } from "react";
import { CalendarDays, RefreshCw } from "lucide-react";
import * as holidayService from "../../services/holidayService";

const TYPE_BADGE = {
  COMPANY: "badge-primary",
  PUBLIC: "badge-sky",
  OPTIONAL: "badge-violet",
};

function formatDate(d) {
  if (!d) return "—";
  return new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function daysUntil(d) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${d}T00:00:00`);
  const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `In ${diff} days`;
}

export default function HolidaysWidget() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    holidayService
      .getUpcomingHolidays(6)
      .then((res) => {
        if (!cancelled) setHolidays(res);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load holidays.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div id="holidays" className="card card-pad scroll-mt-20">
      <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2 mb-4">
        <CalendarDays size={18} className="text-primary" /> Upcoming Holidays
      </h2>

      {error && <div className="state-error mb-4">{error}</div>}

      {loading ? (
        <div className="state-loading">
          <RefreshCw size={16} className="animate-spin" /> Loading holidays…
        </div>
      ) : holidays.length === 0 ? (
        <p className="text-sm text-faint">No upcoming holidays on the calendar.</p>
      ) : (
        <ul className="space-y-2">
          {holidays.map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink truncate">{h.name}</p>
                <p className="text-xs text-muted">{formatDate(h.date)} · {daysUntil(h.date)}</p>
              </div>
              <span className={TYPE_BADGE[h.type] || "badge-primary"}>{h.type}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
