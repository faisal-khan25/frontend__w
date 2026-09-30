import { useEffect, useState, useCallback } from "react";
import { Umbrella, Plus, RefreshCw } from "lucide-react";
import * as leaveService from "../../services/leaveService";
import ApplyLeaveModal from "./ApplyLeaveModal";
import { formatDateOnly } from "../../utils/date";

const STATUS_BADGE = {
  PENDING: "badge-amber",
  APPROVED: "badge-mint",
  REJECTED: "badge-coral",
  CANCELLED: "badge-primary",
};

function formatDate(d) {
  return formatDateOnly(d);
}

export default function LeaveWidget() {
  const [balance, setBalance] = useState(null);
  const [requests, setRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [balanceRes, requestsRes, typesRes] = await Promise.all([
        leaveService.getBalance(),
        leaveService.getMyLeaves(),
        leaveService.getLeaveTypes(),
      ]);
      setBalance(balanceRes);
      setRequests(requestsRes);
      setLeaveTypes(typesRes);
    } catch (err) {
      setError("Unable to load leave information.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleApplied() {
    setModalOpen(false);
    load();
  }

  async function handleCancel(id) {
    setCancellingId(id);
    try {
      await leaveService.cancelLeave(id);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Unable to cancel this request.");
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div id="leave" className="card card-pad scroll-mt-20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
          <Umbrella size={18} className="text-primary" /> Leave Balance &amp; Requests
        </h2>
        <button
          className="btn-primary btn-sm"
          onClick={() => setModalOpen(true)}
          disabled={loading || leaveTypes.length === 0}
        >
          <Plus size={14} /> Apply Leave
        </button>
      </div>

      {error && <div className="state-error mb-4">{error}</div>}

      {loading ? (
        <div className="state-loading">
          <RefreshCw size={16} className="animate-spin" /> Loading leave data…
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-3 gap-3 mb-6">
            {balance?.balances?.length ? (
              balance.balances.map((b) => (
                <div key={b.leaveType.id} className="rounded-xl border border-line bg-canvas px-4 py-3">
                  <p className="text-sm font-semibold text-ink">{b.leaveType.name}</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-extrabold text-primary">{b.remaining}</span>
                    <span className="text-xs text-faint">/ {b.total} remaining</span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">{b.used} used this year</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-faint sm:col-span-3">No leave types configured yet.</p>
            )}
          </div>

          <p className="text-sm font-semibold text-ink mb-3">Recent requests</p>
          {requests.length === 0 ? (
            <p className="text-sm text-faint">You haven't applied for any leave yet.</p>
          ) : (
            <ul className="space-y-2">
              {requests.slice(0, 5).map((req) => (
                <li
                  key={req.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{req.leaveType.name}</p>
                    <p className="text-xs text-muted">
                      {formatDate(req.fromDate)} – {formatDate(req.toDate)} · {req.days} day{req.days === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={STATUS_BADGE[req.status] || "badge-primary"}>{req.status}</span>
                    {req.status === "PENDING" && (
                      <button
                        className="text-xs text-coral hover:underline disabled:opacity-50"
                        disabled={cancellingId === req.id}
                        onClick={() => handleCancel(req.id)}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {modalOpen && (
        <ApplyLeaveModal
          leaveTypes={leaveTypes}
          onClose={() => setModalOpen(false)}
          onApplied={handleApplied}
        />
      )}
    </div>
  );
}
