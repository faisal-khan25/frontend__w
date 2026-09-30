import { useEffect, useState, useCallback } from "react";
import { Wallet, RefreshCw, ChevronDown, ChevronUp, Download, FileText } from "lucide-react";
import * as payrollService from "../../services/payrollService";
import SalarySlipModal from "../payroll/SalarySlipModal";

const STATUS_BADGE = {
  GENERATED: "badge-amber",
  PAID: "badge-mint",
};

function monthLabel(month, year) {
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function formatCurrency(amount, currency) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "INR" }).format(amount);
  } catch {
    return `${currency || ""} ${amount.toFixed(2)}`;
  }
}

export default function PayrollWidget() {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [slipPayrollId, setSlipPayrollId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await payrollService.getMyPayslips();
      setPayslips(result);
    } catch (err) {
      setError("Unable to load payroll information.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div id="payroll" className="card card-pad scroll-mt-20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
          <Wallet size={18} className="text-primary" /> Payroll
        </h2>
        <button className="btn-ghost btn-sm" onClick={load} disabled={loading} title="Refresh">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && <div className="state-error mb-4">{error}</div>}

      {loading ? (
        <div className="state-loading">
          <RefreshCw size={16} className="animate-spin" /> Loading payslips…
        </div>
      ) : payslips.length === 0 ? (
        <p className="text-sm text-faint">No payslips have been generated for you yet.</p>
      ) : (
        <ul className="space-y-2">
          {payslips.map((slip) => {
            const expanded = expandedId === slip.id;
            return (
              <li key={slip.id} className="rounded-xl border border-line overflow-hidden">
                <button
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
                  onClick={() => setExpandedId(expanded ? null : slip.id)}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{monthLabel(slip.month, slip.year)}</p>
                    <p className="text-xs text-muted mt-0.5">
                      Net pay: {formatCurrency(slip.netPay, slip.currency)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={STATUS_BADGE[slip.status] || "badge-primary"}>{slip.status}</span>
                    {expanded ? <ChevronUp size={16} className="text-faint" /> : <ChevronDown size={16} className="text-faint" />}
                  </div>
                </button>
                {expanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-line bg-canvas">
                    <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                      <div>
                        <p className="text-xs text-faint">Basic Salary</p>
                        <p className="font-semibold text-ink">{formatCurrency(slip.basicSalary, slip.currency)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-faint">Allowances</p>
                        <p className="font-semibold text-mint">+ {formatCurrency(slip.allowances, slip.currency)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-faint">Deductions</p>
                        <p className="font-semibold text-coral">− {formatCurrency(slip.deductions, slip.currency)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-faint">Net Pay</p>
                        <p className="font-bold text-primary">{formatCurrency(slip.netPay, slip.currency)}</p>
                      </div>
                    </div>
                    {slip.notes && <p className="text-xs text-muted mt-3">{slip.notes}</p>}
                    {slip.payrollId && (
                      <button
                        className="btn-primary btn-sm mt-3 mr-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSlipPayrollId(slip.payrollId);
                        }}
                      >
                        <FileText size={14} /> View Salary Slip
                      </button>
                    )}
                    {slip.hasPdf && (
                      <button
                        className="btn-secondary btn-sm mt-3"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const blob = await payrollService.downloadMyPayslipLegacy(slip.id);
                          payrollService.triggerBlobDownload(blob, `${slip.payslipNumber || "payslip"}.pdf`);
                        }}
                      >
                        <Download size={14} /> Download Payslip PDF
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {slipPayrollId && <SalarySlipModal payrollId={slipPayrollId} onClose={() => setSlipPayrollId(null)} />}
    </div>
  );
}
