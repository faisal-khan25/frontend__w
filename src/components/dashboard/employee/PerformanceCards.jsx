import { useEffect, useState } from "react";
import { TrendingUp, Timer, RefreshCw } from "lucide-react";
import * as attendanceService from "../../../services/attendanceService";

const DEFAULT_EXPECTED_HOURS = 8;

function formatHrsMins(decimalHours) {
  if (decimalHours == null || Number.isNaN(decimalHours)) return "0 Hrs 0 Mins";
  const hrs = Math.floor(decimalHours);
  const mins = Math.round((decimalHours - hrs) * 60);
  return `${hrs} Hrs ${mins} Mins`;
}

export default function PerformanceCards({ user }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    attendanceService
      .getMonthlySummary()
      .then((res) => {
        if (!cancelled) setSummary(res);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load attendance stats.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const records = summary?.records || [];
  const workedDays = records.filter((r) => r.totalHours != null);
  const avgHours = workedDays.length
    ? workedDays.reduce((sum, r) => sum + Number(r.totalHours), 0) / workedDays.length
    : 0;

  const daysRecorded = summary?.daysRecorded || 0;
  const lateDays = summary?.counts?.LATE || 0;
  const onTimePct = daysRecorded > 0 ? Math.round(((daysRecorded - lateDays) / daysRecorded) * 100) : null;

  const avgPct = Math.min(Math.round((avgHours / DEFAULT_EXPECTED_HOURS) * 100), 100);

  return (
    <>
      <div id="attendance-stats" className="card card-pad">
        <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2 mb-1">
          <Timer size={18} className="text-primary" /> Average Daily Working Hours
        </h2>
        <p className="text-sm text-muted mb-4">
          {user?.name} {user?.role ? `· ${formatRole(user.role)}` : ""}
        </p>

        {loading ? (
          <div className="state-loading">
            <RefreshCw size={16} className="animate-spin" /> Calculating…
          </div>
        ) : error ? (
          <div className="state-error">{error}</div>
        ) : (
          <>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-2xl font-extrabold text-ink">{formatHrsMins(avgHours)}</span>
              <span className="text-sm text-faint">/ {DEFAULT_EXPECTED_HOURS}:00 expected</span>
            </div>
            <div className="w-full h-2.5 rounded-pill bg-canvas overflow-hidden">
              <div className="h-full bg-primary rounded-pill" style={{ width: `${avgPct}%` }} />
            </div>
            <p className="text-xs text-faint mt-2">
              Based on {workedDays.length} completed day{workedDays.length === 1 ? "" : "s"} this month.
            </p>
          </>
        )}
      </div>

      <div className="card card-pad">
        <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2 mb-1">
          <TrendingUp size={18} className="text-primary" /> On-time Arrival
        </h2>
        <p className="text-sm text-muted mb-4">{user?.role ? formatRole(user.role) : ""}</p>

        {loading ? (
          <div className="state-loading">
            <RefreshCw size={16} className="animate-spin" /> Calculating…
          </div>
        ) : error ? (
          <div className="state-error">{error}</div>
        ) : onTimePct === null ? (
          <p className="text-sm text-faint">No attendance recorded yet this month.</p>
        ) : (
          <>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-2xl font-extrabold text-ink">{onTimePct}%</span>
            </div>
            <div className="w-full h-2.5 rounded-pill bg-canvas overflow-hidden">
              <div className="h-full bg-mint rounded-pill" style={{ width: `${onTimePct}%` }} />
            </div>
            <p className="text-xs text-faint mt-2">
              {daysRecorded - lateDays} of {daysRecorded} recorded day{daysRecorded === 1 ? "" : "s"} on time this
              month.
            </p>
          </>
        )}
      </div>
    </>
  );
}

function formatRole(role) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}
