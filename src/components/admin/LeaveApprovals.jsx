import { useEffect, useState, useCallback } from "react";
import { ClipboardCheck, Check, X, RefreshCw } from "lucide-react";
import * as leaveService from "../../services/leaveService";
import { formatDateOnly } from "../../utils/date";

function formatDate(d) {
  return formatDateOnly(d);
}

export default function LeaveApprovals() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [notes, setNotes] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await leaveService.getPendingApprovals();
      setRequests(result);
    } catch (err) {
      setError("Unable to load pending leave requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDecide(id, status) {
    setBusyId(id);
    setError(null);
    try {
      await leaveService.decideLeave(id, { status, note: notes[id] });
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || "Unable to record this decision.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="card card-pad">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
          <ClipboardCheck size={18} className="text-primary" /> Leave Approvals
        </h2>
        {requests.length > 0 && <span className="badge-amber">{requests.length} pending</span>}
      </div>

      {error && <div className="state-error mb-4">{error}</div>}

      {loading ? (
        <div className="state-loading">
          <RefreshCw size={16} className="animate-spin" /> Loading pending requests…
        </div>
      ) : requests.length === 0 ? (
        <p className="text-sm text-faint py-6 text-center">No pending leave requests. All caught up!</p>
      ) : (
        <ul className="space-y-3">
          {requests.map((req) => (
            <li key={req.id} className="rounded-xl border border-line p-4">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {req.employee?.name || "Employee"}
                    {req.employee?.department && <span className="text-faint font-normal"> · {req.employee.department}</span>}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {req.leaveType.name} · {formatDate(req.fromDate)} – {formatDate(req.toDate)} · {req.days} day{req.days === 1 ? "" : "s"}
                  </p>
                  {req.reason && <p className="text-xs text-muted mt-1 italic">"{req.reason}"</p>}
                </div>
                <span className="badge-amber shrink-0">Pending</span>
              </div>

              <input
                className="input-field text-sm mb-3"
                placeholder="Optional note for the employee"
                value={notes[req.id] || ""}
                onChange={(e) => setNotes((prev) => ({ ...prev, [req.id]: e.target.value }))}
              />

              <div className="flex gap-2">
                <button
                  className="btn-primary btn-sm flex-1"
                  disabled={busyId === req.id}
                  onClick={() => handleDecide(req.id, "APPROVED")}
                >
                  <Check size={14} /> Approve
                </button>
                <button
                  className="btn-outline btn-sm flex-1"
                  disabled={busyId === req.id}
                  onClick={() => handleDecide(req.id, "REJECTED")}
                >
                  <X size={14} /> Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
