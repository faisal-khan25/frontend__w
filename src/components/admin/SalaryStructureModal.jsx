import { useEffect, useState } from "react";
import { X, History } from "lucide-react";
import * as payrollService from "../../services/payrollService";

function money(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

export default function SalaryStructureModal({ employee, onClose, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [active, setActive] = useState(null);

  const [basicSalary, setBasicSalary] = useState("");
  const [hra, setHra] = useState("");
  const [otherAllowances, setOtherAllowances] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    payrollService
      .getSalaryStructure(employee.id)
      .then((res) => {
        if (cancelled) return;
        setHistory(res.structures || []);
        setActive(res.active || null);
      })
      .catch(() => !cancelled && setError("Unable to load salary structure."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [employee.id]);

  const gross =
    (Number(basicSalary) || 0) + (Number(hra) || 0) + (Number(otherAllowances) || 0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!basicSalary || Number(basicSalary) <= 0) {
      setError("Basic Salary is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await payrollService.saveSalaryStructure(
        employee.id,
        { basicSalary: Number(basicSalary), hra: Number(hra) || 0, otherAllowances: Number(otherAllowances) || 0, effectiveFrom },
        { isRevision: !!active }
      );
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || "Unable to save the salary structure.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" className="relative card card-pad w-full max-w-xl shadow-card-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold text-ink">Salary Structure — {employee.name}</h3>
          <button onClick={onClose} aria-label="Close" className="text-faint hover:text-ink transition-colors">
            <X size={20} />
          </button>
        </div>

        {error && <div className="state-error mb-4">{error}</div>}

        {loading ? (
          <div className="state-loading">Loading…</div>
        ) : (
          <>
            {active && (
              <div className="rounded-xl bg-primary-50 border border-primary-100 p-3 mb-4 text-sm">
                <p className="font-medium text-ink">
                  Current active structure: {money(active.grossSalary)} / month (since {active.effectiveFrom})
                </p>
                <p className="text-muted mt-1">
                  Basic {money(active.basicSalary)} · HRA {money(active.hra)} · Other {money(active.otherAllowances)}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm font-medium text-ink">
                {active ? "Revise salary (creates a new effective-dated record)" : "Set up salary structure"}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-muted">Basic Salary *</span>
                  <input type="number" min="0" step="0.01" className="input-field mt-1" value={basicSalary} onChange={(e) => setBasicSalary(e.target.value)} required />
                </label>
                <label className="block">
                  <span className="text-xs text-muted">HRA</span>
                  <input type="number" min="0" step="0.01" className="input-field mt-1" value={hra} onChange={(e) => setHra(e.target.value)} />
                </label>
                <label className="block">
                  <span className="text-xs text-muted">Other Allowances</span>
                  <input type="number" min="0" step="0.01" className="input-field mt-1" value={otherAllowances} onChange={(e) => setOtherAllowances(e.target.value)} />
                </label>
                <label className="block">
                  <span className="text-xs text-muted">Effective From *</span>
                  <input type="date" className="input-field mt-1" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} required />
                </label>
              </div>
              <div className="rounded-xl bg-canvas border border-line p-3 text-sm flex items-center justify-between">
                <span className="text-muted">Gross Salary</span>
                <span className="font-display font-bold text-ink">{money(gross)}</span>
              </div>
              <button className="btn-primary w-full" disabled={submitting}>
                {submitting ? "Saving…" : active ? "Save Revision" : "Create Salary Structure"}
              </button>
            </form>

            {history.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-medium text-faint uppercase tracking-wide flex items-center gap-1 mb-2">
                  <History size={12} /> History
                </p>
                <div className="space-y-2">
                  {history.map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-sm border-t border-line pt-2">
                      <span className="text-muted">
                        {s.effectiveFrom} → {s.effectiveTo || "Present"}
                      </span>
                      <span className="font-medium text-ink">{money(s.grossSalary)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
