import { useEffect, useState, useCallback } from "react";
import { X, Download, AlertTriangle, RefreshCw } from "lucide-react";
import * as payrollService from "../../services/payrollService";

function money(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(d) {
  if (!d) return "-";
  const date = new Date(d);
  return Number.isNaN(date.getTime())
    ? String(d)
    : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function Row({ label, value, strong }) {
  return (
    <div className={`flex justify-between gap-3 ${strong ? "font-semibold border-t border-line pt-1.5" : ""}`}>
      <span className={strong ? "" : "text-muted"}>{label}</span>
      <span>{money(value)}</span>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-faint">{label}</p>
      <p className="text-sm font-semibold text-ink break-words">{value || "-"}</p>
    </div>
  );
}

export default function SalarySlipModal({ payrollId, onClose }) {
  const [slip, setSlip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSlip(await payrollService.getSalarySlip(payrollId));
    } catch (err) {
      setError(err.response?.data?.error || "Unable to load the salary slip.");
    } finally {
      setLoading(false);
    }
  }, [payrollId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDownload() {
    setDownloading(true);
    setError(null);
    try {
      const blob = await payrollService.downloadSalarySlipPdf(payrollId);
      payrollService.triggerBlobDownload(blob, `${slip.slipNumber}.pdf`);
    } catch (err) {
      setError(err.response?.data?.error || "Unable to download the salary slip PDF.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden="true" />
      <div role="dialog" aria-modal="true" aria-label="Salary slip" className="relative card card-pad w-full max-w-2xl shadow-card-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-display text-lg font-bold text-ink">Salary Slip{slip ? ` — ${slip.payPeriod.label}` : ""}</h3>
            {slip && <p className="text-xs text-muted mt-0.5">{slip.slipNumber} · Generated {formatDate(slip.generatedAt)}</p>}
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
          <div className="state-loading"><RefreshCw size={16} className="animate-spin" /> Loading salary slip…</div>
        ) : slip ? (
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold text-ink">{slip.company.name}</p>
              <p className="text-xs text-muted">{slip.company.address}</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border border-line p-3">
              <Field label="Employee Name" value={slip.employee.name} />
              <Field label="Employee ID" value={slip.employee.employeeId} />
              <Field label="Department" value={slip.employee.department} />
              <Field label="Designation" value={slip.employee.designation} />
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
              {[
                ["Working", slip.attendance.workingDays],
                ["Present", slip.attendance.presentDays],
                ["Paid Leave", slip.attendance.paidLeaveDays],
                ["Unpaid Leave", slip.attendance.unpaidLeaveDays],
                ["Absent", slip.attendance.absentDays],
                ["LOP Days", slip.attendance.lopDays],
              ].map(([label, val]) => (
                <div key={label} className="rounded-lg bg-canvas border border-line py-2">
                  <p className="font-display font-bold text-ink text-sm">{val}</p>
                  <p className="text-faint">{label}</p>
                </div>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-faint uppercase tracking-wide mb-2">Earnings</p>
                <div className="space-y-1.5 text-sm">
                  <Row label="Basic Salary" value={slip.earnings.basicSalary} />
                  <Row label="HRA" value={slip.earnings.hra} />
                  <Row label="Allowances" value={slip.earnings.allowances} />
                  <Row label="Bonus / Other Earnings" value={slip.earnings.bonusOtherEarnings} />
                  <Row label="Gross Salary" value={slip.earnings.grossSalary} strong />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-faint uppercase tracking-wide mb-2">Deductions</p>
                <div className="space-y-1.5 text-sm">
                  <Row label="Provident Fund (PF)" value={slip.deductions.pf} />
                  <Row label="ESI / Insurance" value={slip.deductions.esi} />
                  <Row label="Professional Tax" value={slip.deductions.professionalTax} />
                  <Row label="TDS" value={slip.deductions.tds} />
                  <Row label="Leave Without Pay (LOP)" value={slip.deductions.lossOfPay} />
                  <Row label="Other Deductions" value={slip.deductions.other} />
                  <Row label="Total Deductions" value={slip.deductions.totalDeductions} strong />
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-primary-50 border border-primary-100 p-3">
              <p className="text-xs text-muted">
                Gross Salary {money(slip.calculation.grossSalary)} − Total Deductions {money(slip.calculation.totalDeductions)}
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="font-medium text-ink">Net Salary</span>
                <span className="font-display text-xl font-extrabold text-primary-700">{money(slip.netSalary)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-muted">
                Payment: {slip.payment.status === "PAID" ? `Paid on ${formatDate(slip.payment.date)}` : "Not yet paid"}
              </p>
              <button className="btn-primary btn-sm" onClick={handleDownload} disabled={downloading}>
                <Download size={14} /> {downloading ? "Preparing PDF…" : "Download PDF"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
