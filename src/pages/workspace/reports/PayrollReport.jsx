import { useCallback, useEffect, useState } from "react";
import { Wallet, Banknote, MinusCircle, PiggyBank } from "lucide-react";
import { reportsApi } from "../../../lib";
import { SkeletonList } from "../../../components/workspace/common/Skeleton";
import ErrorState from "../../../components/workspace/common/ErrorState";
import EmptyState from "../../../components/workspace/common/EmptyState";
import { PAYROLL_STATUS_BADGE, formatCurrency, badgeFor } from "../../../utils/reportsConstants";
import ReportPageHeader from "./components/ReportPageHeader";
import ReportPagination from "./components/ReportPagination";
import ExportButton from "./components/ExportButton";
import StatCardsGrid from "./components/StatCardsGrid";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function PayrollReport() {
  const [payslips, setPayslips] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [department, setDepartment] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filters = {
    department: department || undefined,
    month: month || undefined,
    year: year || undefined,
    page,
    pageSize: 15,
  };

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    reportsApi
      .getPayrollReport(filters)
      .then((res) => {
        setPayslips(res.payslips || []);
        setSummary(res.summary || null);
        setPagination(res.pagination || null);
      })
      .catch((err) => setError(err.response?.data?.error || "Couldn't load the payroll report."))
      .finally(() => setLoading(false));
  }, [department, month, year, page]);

  useEffect(() => { load(); }, [load]);

  const statCards = summary
    ? [
        { key: "count", icon: Wallet, label: "Payslips", value: summary.count, tone: "primary" },
        { key: "gross", icon: Banknote, label: "Gross Total", value: formatCurrency(summary.grossTotal), tone: "sky" },
        { key: "deductions", icon: MinusCircle, label: "Deductions Total", value: formatCurrency(summary.deductionsTotal), tone: "coral" },
        { key: "net", icon: PiggyBank, label: "Net Total", value: formatCurrency(summary.netTotal), tone: "mint" },
      ]
    : [];

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 space-y-5">
      <ReportPageHeader
        icon={Wallet}
        title="Payroll Report"
        description="Payslips, gross/net pay, and deductions. Visible to Admin and HR only."
        actions={<ExportButton type="payroll" filters={filters} />}
      />

      {!loading && !error && <StatCardsGrid cards={statCards} />}

      <div className="card card-pad space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            className="input-field w-40"
            placeholder="Department"
            value={department}
            onChange={(e) => { setPage(1); setDepartment(e.target.value); }}
          />
          <select className="input-field w-40" value={month} onChange={(e) => { setPage(1); setMonth(e.target.value); }}>
            <option value="">All months</option>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <input
            className="input-field w-28"
            type="number"
            placeholder="Year"
            value={year}
            onChange={(e) => { setPage(1); setYear(e.target.value); }}
          />
        </div>

        {loading && <SkeletonList rows={8} />}
        {!loading && error && <ErrorState description={error} onRetry={load} />}
        {!loading && !error && payslips.length === 0 && (
          <EmptyState icon={Wallet} title="No payslips match these filters" />
        )}

        {!loading && !error && payslips.length > 0 && (
          <>
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-faint text-xs uppercase tracking-wide">
                    <th className="px-2 py-2 font-medium">Employee</th>
                    <th className="px-2 py-2 font-medium">Department</th>
                    <th className="px-2 py-2 font-medium">Pay Period</th>
                    <th className="px-2 py-2 font-medium">Gross</th>
                    <th className="px-2 py-2 font-medium">Deductions</th>
                    <th className="px-2 py-2 font-medium">Net</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payslips.map((p) => (
                    <tr key={p.id} className="border-t border-line">
                      <td className="px-2 py-3 font-medium text-ink whitespace-nowrap">{p.employee?.name || "—"}</td>
                      <td className="px-2 py-3 text-muted whitespace-nowrap">{p.employee?.department || "—"}</td>
                      <td className="px-2 py-3 text-muted whitespace-nowrap">{p.payPeriod}</td>
                      <td className="px-2 py-3 text-muted whitespace-nowrap">{formatCurrency(p.grossSalary)}</td>
                      <td className="px-2 py-3 text-muted whitespace-nowrap">{formatCurrency(p.deductions)}</td>
                      <td className="px-2 py-3 font-semibold text-ink whitespace-nowrap">{formatCurrency(p.netSalary)}</td>
                      <td className="px-2 py-3">
                        <span className={badgeFor(PAYROLL_STATUS_BADGE, p.status)}>{p.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ReportPagination pagination={pagination} page={page} onPageChange={setPage} itemLabel="payslips" />
          </>
        )}
      </div>
    </div>
  );
}
