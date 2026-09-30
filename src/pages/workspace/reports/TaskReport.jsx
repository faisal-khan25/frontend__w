import { useCallback, useEffect, useState } from "react";
import { ListTodo, Clock3, Loader, CheckCircle2, AlertTriangle, Ban } from "lucide-react";
import { reportsApi } from "../../../lib";
import { SkeletonList } from "../../../components/workspace/common/Skeleton";
import ErrorState from "../../../components/workspace/common/ErrorState";
import EmptyState from "../../../components/workspace/common/EmptyState";
import { formatDateOnly } from "../../../utils/date";
import {
  TASK_STATUS_BADGE, TASK_STATUS_LABEL, TASK_STATUSES,
  TASK_PRIORITY_BADGE, TASK_PRIORITY_LABEL, TASK_PRIORITIES,
  badgeFor, labelFor,
} from "../../../utils/reportsConstants";
import ReportPageHeader from "./components/ReportPageHeader";
import ReportPagination from "./components/ReportPagination";
import ExportButton from "./components/ExportButton";
import StatCardsGrid from "./components/StatCardsGrid";

export default function TaskReport() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [workload, setWorkload] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filters = {
    department: department || undefined,
    status: status || undefined,
    priority: priority || undefined,
    page,
    pageSize: 15,
  };

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    reportsApi
      .getTaskReport(filters)
      .then((res) => {
        setTasks(res.tasks || []);
        setStats(res.stats || null);
        setWorkload(res.workloadByEmployee || []);
        setPagination(res.pagination || null);
      })
      .catch((err) => setError(err.response?.data?.error || "Couldn't load the task report."))
      .finally(() => setLoading(false));
  }, [department, status, priority, page]);

  useEffect(() => { load(); }, [load]);

  const statCards = stats
    ? [
        { key: "pending", icon: Clock3, label: "Pending", value: stats.pending, tone: "amber" },
        { key: "inProgress", icon: Loader, label: "In Progress", value: stats.inProgress, tone: "sky" },
        { key: "completed", icon: CheckCircle2, label: "Completed", value: stats.completed, tone: "mint" },
        { key: "overdue", icon: AlertTriangle, label: "Overdue", value: stats.overdue, tone: "coral" },
        { key: "cancelled", icon: Ban, label: "Cancelled", value: stats.cancelled, tone: "primary" },
      ]
    : [];

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6 space-y-5">
      <ReportPageHeader
        icon={ListTodo}
        title="Task Report"
        description="Task status, priority, and workload by employee."
        actions={<ExportButton type="tasks" filters={filters} />}
      />

      {!loading && !error && <StatCardsGrid cards={statCards} />}

      {!loading && !error && workload.length > 0 && (
        <div className="card card-pad">
          <h2 className="font-display font-bold text-ink text-sm mb-3">Workload by employee</h2>
          <div className="space-y-2.5">
            {workload.map((w) => {
              const pct = w.total > 0 ? Math.round((w.completed / w.total) * 100) : 0;
              return (
                <div key={w.employeeId} className="flex items-center gap-3">
                  <div className="w-40 shrink-0 truncate">
                    <p className="text-sm font-medium text-ink truncate">{w.name}</p>
                    <p className="text-[11px] text-faint truncate">{w.department || "—"}</p>
                  </div>
                  <div className="flex-1 h-2 rounded-pill bg-line overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-pill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-muted shrink-0 w-20 text-right">{w.completed}/{w.total} done</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card card-pad space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            className="input-field w-40"
            placeholder="Department"
            value={department}
            onChange={(e) => { setPage(1); setDepartment(e.target.value); }}
          />
          <select className="input-field w-40" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
            <option value="">All statuses</option>
            {TASK_STATUSES.map((s) => <option key={s} value={s}>{TASK_STATUS_LABEL[s]}</option>)}
          </select>
          <select className="input-field w-36" value={priority} onChange={(e) => { setPage(1); setPriority(e.target.value); }}>
            <option value="">All priorities</option>
            {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{TASK_PRIORITY_LABEL[p]}</option>)}
          </select>
        </div>

        {loading && <SkeletonList rows={8} />}
        {!loading && error && <ErrorState description={error} onRetry={load} />}
        {!loading && !error && tasks.length === 0 && (
          <EmptyState icon={ListTodo} title="No tasks match these filters" />
        )}

        {!loading && !error && tasks.length > 0 && (
          <>
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-faint text-xs uppercase tracking-wide">
                    <th className="px-2 py-2 font-medium">Task</th>
                    <th className="px-2 py-2 font-medium">Assigned To</th>
                    <th className="px-2 py-2 font-medium">Department</th>
                    <th className="px-2 py-2 font-medium">Priority</th>
                    <th className="px-2 py-2 font-medium">Status</th>
                    <th className="px-2 py-2 font-medium">Due Date</th>
                    <th className="px-2 py-2 font-medium">Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((t) => (
                    <tr key={t.id} className="border-t border-line">
                      <td className="px-2 py-3 font-medium text-ink whitespace-nowrap max-w-xs truncate">{t.title}</td>
                      <td className="px-2 py-3 text-muted whitespace-nowrap">{t.assignee?.name || "—"}</td>
                      <td className="px-2 py-3 text-muted whitespace-nowrap">{t.department || "—"}</td>
                      <td className="px-2 py-3">
                        <span className={badgeFor(TASK_PRIORITY_BADGE, t.priority)}>{labelFor(TASK_PRIORITY_LABEL, t.priority)}</span>
                      </td>
                      <td className="px-2 py-3">
                        <span className={badgeFor(TASK_STATUS_BADGE, t.status)}>{labelFor(TASK_STATUS_LABEL, t.status)}</span>
                      </td>
                      <td className="px-2 py-3 text-muted whitespace-nowrap">{t.dueDate ? formatDateOnly(t.dueDate) : "—"}</td>
                      <td className="px-2 py-3 text-muted whitespace-nowrap">{t.completedDate ? formatDateOnly(t.completedDate) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ReportPagination pagination={pagination} page={page} onPageChange={setPage} itemLabel="tasks" />
          </>
        )}
      </div>
    </div>
  );
}
