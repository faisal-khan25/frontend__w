import { useEffect, useState, useCallback } from "react";
import { Wallet, RefreshCw, PlayCircle, Settings2 } from "lucide-react";
import * as payrollService from "../../services/payrollService";
import * as employeeService from "../../services/employeeService";
import PayrollDetailModal from "./PayrollDetailModal";
import SalarySlipModal from "../payroll/SalarySlipModal";
import SalaryStructureModal from "./SalaryStructureModal";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STATUSES = ["DRAFT", "CALCULATED", "APPROVED", "FINALIZED", "PAYSLIP_GENERATED", "PAID"];

const STATUS_BADGE = {
  DRAFT: "badge-sky",
  CALCULATED: "badge-amber",
  APPROVED: "badge-violet",
  FINALIZED: "badge-primary",
  PAYSLIP_GENERATED: "badge-sky",
  PAID: "badge-mint",
};

const SLIP_READY = ["FINALIZED", "PAYSLIP_GENERATED", "PAID"];

const now = new Date();

function money(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

export default function PayrollManagement() {
  const [employees, setEmployees] = useState([]);
  const [runEmployeeId, setRunEmployeeId] = useState("");
  const [runMonth, setRunMonth] = useState(now.getMonth() + 1);
  const [runYear, setRunYear] = useState(now.getFullYear());

  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ month: "", year: "", status: "", paymentStatus: "", search: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [detailTarget, setDetailTarget] = useState(null);
  const [salaryTarget, setSalaryTarget] = useState(null);
  const [slipPayrollId, setSlipPayrollId] = useState(null);

  useEffect(() => {
    employeeService.listEmployees({ pageSize: 200, isActive: true }).then((r) => setEmployees(r.employees || [])).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await payrollService.listPayroll({
        page,
        pageSize: 10,
        month: filters.month || undefined,
        year: filters.year || undefined,
        status: filters.status || undefined,
        paymentStatus: filters.paymentStatus || undefined,
        search: filters.search || undefined,
      });
      setRows(result.payrolls);
      setPagination(result.pagination);
    } catch {
      setError("Unable to load payroll records.");
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    load();
  }, [load]);

  function handleRunPayroll() {
    if (!runEmployeeId) return;
    const emp = employees.find((e) => e.id === runEmployeeId);
    setDetailTarget({ mode: "create", employeeId: runEmployeeId, employeeName: emp?.name, month: Number(runMonth), year: Number(runYear) });
  }

  function handleChanged() {
    load();
  }

  return (
    <div className="card card-pad">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
          <Wallet size={18} className="text-primary" /> Payroll
        </h2>
      </div>

      <div className="rounded-xl border border-line p-3 mb-5 flex flex-wrap items-end gap-3">
        <label className="block min-w-[200px] flex-1">
          <span className="text-xs text-muted">Employee</span>
          <select className="input-field mt-1" value={runEmployeeId} onChange={(e) => setRunEmployeeId(e.target.value)}>
            <option value="">Select employee…</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name} {e.department ? `· ${e.department}` : ""}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-muted">Month</span>
          <select className="input-field mt-1" value={runMonth} onChange={(e) => setRunMonth(e.target.value)}>
            {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-muted">Year</span>
          <input type="number" className="input-field mt-1 w-24" value={runYear} onChange={(e) => setRunYear(e.target.value)} />
        </label>
        <button className="btn-primary btn-sm" disabled={!runEmployeeId} onClick={handleRunPayroll}>
          <PlayCircle size={14} /> Calculate Payroll
        </button>
        {runEmployeeId && (
          <button
            className="btn-secondary btn-sm"
            onClick={() => setSalaryTarget(employees.find((e) => e.id === runEmployeeId))}
          >
            <Settings2 size={14} /> Manage Salary
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <input className="input-field w-44" placeholder="Search employee" value={filters.search} onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, search: e.target.value })); }} />
        <select className="input-field w-32" value={filters.month} onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, month: e.target.value })); }}>
          <option value="">All months</option>
          {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <input type="number" className="input-field w-24" placeholder="Year" value={filters.year} onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, year: e.target.value })); }} />
        <select className="input-field w-40" value={filters.status} onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, status: e.target.value })); }}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
        <select className="input-field w-36" value={filters.paymentStatus} onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, paymentStatus: e.target.value })); }}>
          <option value="">All payments</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PAID">Paid</option>
        </select>
      </div>

      {error && <div className="state-error mb-4">{error}</div>}

      {loading ? (
        <div className="state-loading"><RefreshCw size={16} className="animate-spin" /> Loading payroll…</div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-faint py-6 text-center">No payroll records match these filters.</p>
      ) : (
        <>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-faint text-xs uppercase tracking-wide">
                  <th className="px-2 py-2 font-medium">Employee</th>
                  <th className="px-2 py-2 font-medium">Month</th>
                  <th className="px-2 py-2 font-medium">Gross</th>
                  <th className="px-2 py-2 font-medium">Deductions</th>
                  <th className="px-2 py-2 font-medium">Net Salary</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Payment</th>
                  <th className="px-2 py-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-t border-line">
                    <td className="px-2 py-3 font-medium text-ink whitespace-nowrap">{p.employee?.name}</td>
                    <td className="px-2 py-3 text-muted whitespace-nowrap">{MONTH_NAMES[p.month - 1]} {p.year}</td>
                    <td className="px-2 py-3 whitespace-nowrap">{money(p.grossSalary)}</td>
                    <td className="px-2 py-3 whitespace-nowrap">{money(p.totalDeductions)}</td>
                    <td className="px-2 py-3 font-semibold whitespace-nowrap">{money(p.netSalary)}</td>
                    <td className="px-2 py-3"><span className={STATUS_BADGE[p.status]}>{p.status.replace("_", " ")}</span></td>
                    <td className="px-2 py-3"><span className={p.paymentStatus === "PAID" ? "badge-mint" : "badge-coral"}>{p.paymentStatus}</span></td>
                    <td className="px-2 py-3 text-right">
                      <button className="text-primary hover:underline text-xs font-medium" onClick={() => setDetailTarget({ mode: "view", id: p.id })}>
                        View
                      </button>
                      {SLIP_READY.includes(p.status) && (
                        <button className="text-primary hover:underline text-xs font-medium ml-3" onClick={() => setSlipPayrollId(p.id)}>
                          Salary Slip
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-faint">Page {pagination.page} of {pagination.totalPages} · {pagination.total} records</span>
              <div className="flex gap-2">
                <button className="pill !py-1 !px-3 text-xs disabled:opacity-40" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                <button className="pill !py-1 !px-3 text-xs disabled:opacity-40" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {detailTarget && (
        <PayrollDetailModal target={detailTarget} onClose={() => setDetailTarget(null)} onChanged={handleChanged} />
      )}
      {slipPayrollId && <SalarySlipModal payrollId={slipPayrollId} onClose={() => setSlipPayrollId(null)} />}
      {salaryTarget && (
        <SalaryStructureModal employee={salaryTarget} onClose={() => setSalaryTarget(null)} onSaved={() => setSalaryTarget(null)} />
      )}
    </div>
  );
}
