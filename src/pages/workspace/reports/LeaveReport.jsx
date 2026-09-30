import { useCallback, useEffect, useState } from "react";
import { Umbrella, CheckCircle2, Clock3, XCircle, Ban } from "lucide-react";
import { reportsApi } from "../../../lib";
import { SkeletonList } from "../../../components/workspace/common/Skeleton";
import ErrorState from "../../../components/workspace/common/ErrorState";
import EmptyState from "../../../components/workspace/common/EmptyState";
import { formatDateOnly } from "../../../utils/date";
import { LEAVE_STATUS_BADGE, LEAVE_STATUS_LABEL, LEAVE_STATUSES, badgeFor, labelFor } from "../../../utils/reportsConstants";
import ReportPageHeader from "./components/ReportPageHeader";
import ReportPagination from "./components/ReportPagination";
import ExportButton from "./components/ExportButton";
import DateRangeFilter from "./components/DateRangeFilter";
import StatCardsGrid from "./components/StatCardsGrid";

export default function LeaveReport() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [range, setRange] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filters = {
    department: department || undefined,
    status: status || undefined,
    range: from || to ? undefined : range || undefined,
    from: from || undefined,
    to: to || undefined,
    page,
    pageSize: 15,
  };

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    reportsApi
      .getLeaveReport(filters)
      .then((res) => {
        setRecords(res.records || []);
        setSummary(res.summary || null);
        setPagination(res.pagination || null);
      })
      .catch((err) => setError(err.response?.data?.error || "Couldn't load the leave report."))
      .finally(() => setLoading(false));
    
  }, [department, status, range, from, to, page]);

  useEffect(() => { load(); }, [load]);

  const statCards = summary
    ? [
        { key: "approved", icon: CheckCircle2, label: "Approved", value: summary.approved, tone: "mint" },
        { key: "pending", icon: Clock3, label: "Pending", value: summary.pending, tone: "amber" },
        { key: "rejected", icon: XCircle, label: "Rejected", value: summary.rejected, tone: "coral" },
        { key: "cancelled", icon: Ban, label: "Cancelled", value: summary.cancelled, tone: "primary" },
      ]
    : [];

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 space-y-5">
      <ReportPageHeader
        icon={Umbrella}
        title="Leave Report"
        description="Leave requests by type, status, and date range."
        actions={<ExportButton type="leave" filters={filters} />}
      />

      {!loading && !error && <StatCardsGrid cards={statCards} />}

      <div className="card card-pad space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <DateRangeFilter
            range={range}
            from={from}
            to={to}
            onChange={(v) => { setPage(1); setRange(v.range); setFrom(v.from); setTo(v.to); }}
          />
          <input
            className="input-field w-40"
            placeholder="Department"
            value={department}
            onChange={(e) => { setPage(1); setDepartment(e.target.value); }}
          />
          <select className="input-field w-40" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
            <option value="">All statuses</option>
            {LEAVE_STATUSES.map((s) => <option key={s} value={s}>{LEAVE_STATUS_LABEL[s]}</option>)}
          </select>
        </div>

        {loading && <SkeletonList rows={8} />}
        {!loading && error && <ErrorState description={error} onRetry={load} />}
        {!loading && !error && records.length === 0 && (
          <EmptyState icon={Umbrella} title="No leave requests match these filters" />
        )}

        {!loading && !error && records.length > 0 && (
          <>
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-faint text-xs uppercase tracking-wide">
                    <th className="px-2 py-2 font-medium">Employee</th>
                    <th className="px-2 py-2 font-medium">Department</th>
                    <th className="px-2 py-2 font-medium">Leave Type</th>
                    <th className="px-2 py-2 font-medium">From</th>
                    <th className="px-2 py-2 font-medium">To</th>
                    <th className="px-2 py-2 font-medium">Days</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id} className="border-t border-line">
                      <td className="px-2 py-3 font-medium text-ink whitespace-nowrap">{r.employee?.name || "—"}</td>
                      <td className="px-2 py-3 text-muted whitespace-nowrap">{r.employee?.department || "—"}</td>
                      <td className="px-2 py-3 text-muted whitespace-nowrap">{r.leaveType || "—"}</td>
                      <td className="px-2 py-3 text-muted whitespace-nowrap">{formatDateOnly(r.fromDate)}</td>
                      <td className="px-2 py-3 text-muted whitespace-nowrap">{formatDateOnly(r.toDate)}</td>
                      <td className="px-2 py-3 text-muted whitespace-nowrap">{r.days}</td>
                      <td className="px-2 py-3">
                        <span className={badgeFor(LEAVE_STATUS_BADGE, r.status)}>{labelFor(LEAVE_STATUS_LABEL, r.status)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ReportPagination pagination={pagination} page={page} onPageChange={setPage} itemLabel="requests" />
          </>
        )}
      </div>
    </div>
  );
}
