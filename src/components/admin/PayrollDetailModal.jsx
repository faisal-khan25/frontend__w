import { useEffect, useState, useCallback } from "react";
import { X, RefreshCw, Download, AlertTriangle } from "lucide-react";
import * as payrollService from "../../services/payrollService";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STATUS_BADGE = {
  DRAFT: "badge-sky",
  CALCULATED: "badge-amber",
  APPROVED: "badge-violet",
  FINALIZED: "badge-primary",
  PAYSLIP_GENERATED: "badge-sky",
  PAID: "badge-mint",
};

const DEDUCTION_FIELDS = [
  ["pf", "PF"],
  ["professionalTax", "Professional Tax"],
  ["tds", "TDS"],
  ["insurance", "Insurance"],
  ["loanRecovery", "Loan Recovery"],
  ["salaryAdvance", "Salary Advance"],
  ["otherDeductions", "Other Deductions"],
];

function money(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function PayrollDetailModal({ target, onClose, onChanged }) {
  const isCreate = target.mode === "create";
  const [record, setRecord] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const [otherEarnings, setOtherEarnings] = useState(0);
  const [deductions, setDeductions] = useState({});
  const [overrideEnabled, setOverrideEnabled] = useState(false);
  const [overrideGrossSalary, setOverrideGrossSalary] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [paymentReference, setPaymentReference] = useState("");

  const status = record?.status;
  const locked = record && ["FINALIZED", "PAYSLIP_GENERATED", "PAID"].includes(status);
  const canEdit = !locked;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isCreate) {
        const p = await payrollService.calculatePayrollPreview({
          employeeId: target.employeeId,
          month: target.month,
          year: target.year,
        });
        setPreview(p);
        setDeductions({
          pf: p.pf, professionalTax: p.professionalTax, tds: p.tds,
          insurance: p.insurance, loanRecovery: p.loanRecovery,
          salaryAdvance: p.salaryAdvance, otherDeductions: p.otherDeductions,
        });
        setOtherEarnings(p.otherEarnings || 0);
      } else {
        const r = await payrollService.getPayroll(target.id);
        setRecord(r);
        setPreview(r);
        setDeductions({
          pf: r.pf, professionalTax: r.professionalTax, tds: r.tds,
          insurance: r.insurance, loanRecovery: r.loanRecovery,
          salaryAdvance: r.salaryAdvance, otherDeductions: r.otherDeductions,
        });
        setOtherEarnings(r.otherEarnings || 0);
        if (r.manualOverride) {
          setOverrideEnabled(true);
          setOverrideGrossSalary(r.grossSalary);
          setOverrideReason(r.overrideReason || "");
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || "Unable to load payroll data. Does this employee have an active salary structure?");
    } finally {
      setLoading(false);
    }
  }, [isCreate, target]);

  useEffect(() => {
    load();
  }, [load]);

  function buildPayload() {
    return {
      employeeId: record?.employeeId ?? target.employeeId,
      month: record?.month ?? target.month,
      year: record?.year ?? target.year,
      otherEarnings: Number(otherEarnings) || 0,
      deductions: Object.fromEntries(DEDUCTION_FIELDS.map(([k]) => [k, Number(deductions[k]) || 0])),
      overrideGrossSalary: overrideEnabled ? Number(overrideGrossSalary) || 0 : undefined,
      overrideReason: overrideEnabled ? overrideReason : undefined,
    };
  }

  async function handleRecalculate() {
    setBusy(true);
    setError(null);
    try {
      const payload = buildPayload();
      const p = await payrollService.calculatePayrollPreview(payload);
      setPreview(p);
    } catch (err) {
      setError(err.response?.data?.error || "Unable to recalculate.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (loading || !canEdit || (overrideEnabled && !Number(overrideGrossSalary))) return undefined;
    const timer = setTimeout(async () => {
      try {
        const p = await payrollService.calculatePayrollPreview({
          ...buildPayload(),
          overrideReason: overrideEnabled ? overrideReason || "preview" : undefined,
        });
        setPreview(p);
      } catch {
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [otherEarnings, deductions, overrideEnabled, overrideGrossSalary]);

  async function handleSave() {
    if (overrideEnabled && !overrideReason.trim()) {
      setError("An override reason is required when manually changing the gross salary.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload = buildPayload();
      const saved = record ? await payrollService.updatePayroll(record.id, payload) : await payrollService.createPayroll(payload);
      setRecord(saved);
      setPreview(saved);
      onChanged?.();
    } catch (err) {
      setError(err.response?.data?.error || "Unable to save payroll.");
    } finally {
      setBusy(false);
    }
  }

  async function runAction(fn) {
    setBusy(true);
    setError(null);
    try {
      const updated = await fn();
      setRecord(updated);
      setPreview(updated);
      onChanged?.();
    } catch (err) {
      setError(err.response?.data?.error || "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload() {
    try {
      const blob = record ? await payrollService.downloadAdminPayslip(record.id) : null;
      if (blob) payrollService.triggerBlobDownload(blob, `${record.payslipId ? "payslip" : "payroll"}-${record.employeeId}-${record.month}-${record.year}.pdf`);
    } catch {
      setError("Unable to download payslip.");
    }
  }

  const view = preview || record;
  const employeeName = target.employeeName || record?.employee?.name;
  const month = target.month || record?.month;
  const year = target.year || record?.year;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" className="relative card card-pad w-full max-w-2xl shadow-card-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-lg font-bold text-ink">
              Payroll — {employeeName} · {MONTH_NAMES[month - 1]} {year}
            </h3>
            {status && <span className={`${STATUS_BADGE[status]} mt-1 inline-block`}>{status.replace("_", " ")}</span>}
          </div>
          <button onClick={onClose} aria-label="Close" className="text-faint hover:text-ink transition-colors">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="state-error mb-4 flex items-start gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="state-loading">Loading…</div>
        ) : view ? (
          <div className="space-y-5">
            {locked && (
              <p className="text-xs text-faint bg-canvas border border-line rounded-lg px-3 py-2">
                This payroll has been finalized and can no longer be edited.
              </p>
            )}

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
              {[
                ["Working", view.workingDays],
                ["Present", view.presentDays],
                ["Paid Leave", view.paidLeaveDays],
                ["Unpaid Leave", view.unpaidLeaveDays],
                ["Absent", view.absentDays],
                ["LOP Days", view.lopDays],
              ].map(([label, val]) => (
                <div key={label} className="rounded-lg bg-canvas border border-line py-2">
                  <p className="font-display font-bold text-ink text-sm">{val}</p>
                  <p className="text-faint">{label}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-line p-3">
              <label className="flex items-center gap-2 text-sm font-medium text-ink">
                <input type="checkbox" disabled={!canEdit} checked={overrideEnabled} onChange={(e) => setOverrideEnabled(e.target.checked)} />
                Manual Salary Override
              </label>
              {overrideEnabled && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <label className="block">
                    <span className="text-xs text-muted">Override Gross Salary</span>
                    <input type="number" min="0" step="0.01" disabled={!canEdit} className="input-field mt-1" value={overrideGrossSalary} onChange={(e) => setOverrideGrossSalary(e.target.value)} />
                  </label>
                  <label className="block col-span-2 sm:col-span-1">
                    <span className="text-xs text-muted">Override Reason *</span>
                    <input type="text" disabled={!canEdit} className="input-field mt-1" value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="e.g. Performance bonus" />
                  </label>
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-faint uppercase tracking-wide mb-2">Earnings</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-muted">Basic</span><span>{money(view.basicSalary)}</span></div>
                  <div className="flex justify-between"><span className="text-muted">HRA</span><span>{money(view.hra)}</span></div>
                  <div className="flex justify-between"><span className="text-muted">Other Allowances</span><span>{money(view.otherAllowances)}</span></div>
                  <label className="flex justify-between items-center">
                    <span className="text-muted">Other Earnings</span>
                    <input type="number" min="0" step="0.01" disabled={!canEdit} className="input-field !w-28 !py-1 text-right" value={otherEarnings} onChange={(e) => setOtherEarnings(e.target.value)} />
                  </label>
                  <div className="flex justify-between font-semibold border-t border-line pt-1.5"><span>Gross Salary</span><span>{money(view.grossSalary)}</span></div>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-faint uppercase tracking-wide mb-2">Deductions</p>
                <div className="space-y-1.5 text-sm">
                  {DEDUCTION_FIELDS.map(([key, label]) => (
                    <label key={key} className="flex justify-between items-center">
                      <span className="text-muted">{label}</span>
                      <input type="number" min="0" step="0.01" disabled={!canEdit} className="input-field !w-28 !py-1 text-right" value={deductions[key] ?? 0} onChange={(e) => setDeductions((d) => ({ ...d, [key]: e.target.value }))} />
                    </label>
                  ))}
                  <div className="flex justify-between"><span className="text-muted">LOP (auto)</span><span>{money(view.lopAmount)}</span></div>
                  <div className="flex justify-between font-semibold border-t border-line pt-1.5"><span>Total Deductions</span><span>{money(view.totalDeductions)}</span></div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-primary-50 border border-primary-100 p-3 flex items-center justify-between">
              <span className="font-medium text-ink">Net Salary</span>
              <span className="font-display text-xl font-extrabold text-primary-700">{money(view.netSalary)}</span>
            </div>

            {canEdit && (
              <div className="flex gap-2">
                <button className="btn-secondary btn-sm flex-1" disabled={busy} onClick={handleRecalculate}>
                  <RefreshCw size={14} className={busy ? "animate-spin" : ""} /> Recalculate
                </button>
                <button className="btn-primary btn-sm flex-1" disabled={busy} onClick={handleSave}>
                  {busy ? "Saving…" : record ? "Save Changes" : "Calculate Payroll"}
                </button>
              </div>
            )}

            {record && (
              <div className="border-t border-line pt-4 flex flex-wrap gap-2">
                {status === "CALCULATED" && (
                  <button className="btn-primary btn-sm" disabled={busy} onClick={() => runAction(() => payrollService.approvePayroll(record.id))}>
                    Approve Payroll
                  </button>
                )}
                {status === "APPROVED" && (
                  <button className="btn-primary btn-sm" disabled={busy} onClick={() => runAction(() => payrollService.finalizePayroll(record.id))}>
                    Finalize Payroll
                  </button>
                )}
                {status === "FINALIZED" && (
                  <button className="btn-primary btn-sm" disabled={busy} onClick={() => runAction(() => payrollService.generatePayslip(record.id))}>
                    Generate Payslip
                  </button>
                )}
                {status === "PAYSLIP_GENERATED" && (
                  <div className="flex flex-wrap items-center gap-2 w-full">
                    <input type="text" placeholder="Payment reference (optional)" className="input-field !w-56" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} />
                    <button className="btn-primary btn-sm" disabled={busy} onClick={() => runAction(() => payrollService.markPayrollPaid(record.id, { paymentReference }))}>
                      Mark as Paid
                    </button>
                  </div>
                )}
                {["PAYSLIP_GENERATED", "PAID"].includes(status) && (
                  <button className="btn-secondary btn-sm" onClick={handleDownload}>
                    <Download size={14} /> Download Payslip
                  </button>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
