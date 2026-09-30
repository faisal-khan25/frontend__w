import { useEffect, useState, useCallback } from "react";
import { Clock, LogIn, LogOut, RefreshCw } from "lucide-react";
import * as attendanceService from "../../services/attendanceService";

const STATUS_BADGE = {
  PRESENT: "badge-mint",
  LATE: "badge-amber",
  HALF_DAY: "badge-violet",
  WORK_FROM_HOME: "badge-sky",
  ABSENT: "badge-coral",
};

const STATUS_LABEL = {
  PRESENT: "Present",
  LATE: "Late",
  HALF_DAY: "Half day",
  WORK_FROM_HOME: "Work from home",
  ABSENT: "Absent",
};

function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function monthLabel(month, year) {
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function todayLabel() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function AttendanceWidget() {
  const [today, setToday] = useState(null);
  const [summary, setSummary] = useState(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const now = new Date();
  const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const month = targetDate.getMonth() + 1;
  const year = targetDate.getFullYear();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [todayRes, summaryRes] = await Promise.all([
        attendanceService.getToday(),
        attendanceService.getMonthlySummary({ month, year }),
      ]);
      setToday(todayRes);
      setSummary(summaryRes);
    } catch (err) {
      setError("Unable to load attendance information.");
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePunchIn() {
    setActionLoading(true);
    setError(null);
    try {
      const record = await attendanceService.punchIn();
      setToday(record);
      if (monthOffset === 0) load();
    } catch (err) {
      setError(err.response?.data?.error || "Unable to punch in. Please try again.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePunchOut() {
    setActionLoading(true);
    setError(null);
    try {
      const record = await attendanceService.punchOut();
      setToday(record);
      if (monthOffset === 0) load();
    } catch (err) {
      setError(err.response?.data?.error || "Unable to punch out. Please try again.");
    } finally {
      setActionLoading(false);
    }
  }

  const canPunchIn = !today || !today.punchIn;
  const canPunchOut = today && today.punchIn && !today.punchOut;

  return (
    <div id="attendance" className="card card-pad scroll-mt-20">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
          <Clock size={18} className="text-primary" /> Today's Attendance
        </h2>
        {today?.status && <span className={STATUS_BADGE[today.status] || "badge-primary"}>{STATUS_LABEL[today.status]}</span>}
      </div>
      <p className="text-sm text-muted mb-4">{todayLabel()}</p>

      {error && <div className="state-error mb-4">{error}</div>}

      {loading ? (
        <div className="state-loading">
          <RefreshCw size={16} className="animate-spin" /> Loading attendance…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl bg-canvas px-4 py-3">
              <p className="text-lg font-bold text-ink">
                {today?.totalHours != null ? `${Math.floor(today.totalHours)} Hrs ${Math.round((today.totalHours % 1) * 60)} Mins` : "0 Hrs 0 Mins"}
              </p>
              <p className="text-xs text-faint mt-0.5">Total Work Time</p>
            </div>
            <div className="rounded-xl bg-canvas px-4 py-3">
              <p className="text-lg font-bold text-faint">Not tracked</p>
              <p className="text-xs text-faint mt-0.5">Total Break Time</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <p className="text-xs text-faint uppercase tracking-wide">Time In</p>
              <p className="text-ink font-semibold">{formatTime(today?.punchIn)}</p>
            </div>
            <div>
              <p className="text-xs text-faint uppercase tracking-wide">Time Out</p>
              <p className="text-ink font-semibold">{formatTime(today?.punchOut)}</p>
            </div>
          </div>

          {canPunchIn && (
            <button onClick={handlePunchIn} disabled={actionLoading} className="btn-primary w-full">
              <LogIn size={16} /> Tap In
            </button>
          )}
          {canPunchOut && (
            <button onClick={handlePunchOut} disabled={actionLoading} className="btn-outline w-full">
              <LogOut size={16} /> Tap Out
            </button>
          )}
          {!canPunchIn && !canPunchOut && (
            <div className="state-success">You've completed today's attendance. See you tomorrow!</div>
          )}

          <div className="mt-5 pt-4 border-t border-line">
            <p className="text-sm font-semibold text-ink mb-2">Today's Entries</p>
            {today?.punchIn ? (
              <ul className="space-y-1.5">
                <li className="flex items-center gap-2 text-sm text-ink">
                  <span className="w-1.5 h-1.5 rounded-full bg-mint shrink-0" /> {formatTime(today.punchIn)}
                  <span className="text-faint">Tap In</span>
                </li>
                {today.punchOut && (
                  <li className="flex items-center gap-2 text-sm text-ink">
                    <span className="w-1.5 h-1.5 rounded-full bg-coral shrink-0" /> {formatTime(today.punchOut)}
                    <span className="text-faint">Tap Out</span>
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-sm text-faint">No entries yet today.</p>
            )}
          </div>

          <div className="mt-6 pt-5 border-t border-line">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-ink">Monthly summary</p>
              <div className="flex items-center gap-2">
                <button
                  className="pill !py-1 !px-3 text-xs"
                  onClick={() => setMonthOffset((o) => Math.max(o - 1, -11))}
                >
                  Previous
                </button>
                <span className="text-xs text-muted min-w-[7rem] text-center">{monthLabel(month, year)}</span>
                <button
                  className="pill !py-1 !px-3 text-xs disabled:opacity-40"
                  disabled={monthOffset >= 0}
                  onClick={() => setMonthOffset((o) => Math.min(o + 1, 0))}
                >
                  Next
                </button>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-2 text-center">
              {["PRESENT", "LATE", "HALF_DAY", "WORK_FROM_HOME", "ABSENT"].map((key) => (
                <div key={key} className="rounded-xl bg-canvas px-2 py-3">
                  <p className="text-lg font-bold text-ink">{summary?.counts?.[key] ?? 0}</p>
                  <p className="text-[11px] text-faint leading-tight mt-1">{STATUS_LABEL[key]}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
