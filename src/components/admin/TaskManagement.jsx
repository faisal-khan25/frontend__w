import { useEffect, useState, useCallback } from "react";
import { ClipboardList, Plus, RefreshCw, Pencil, Trash2, Eye, Search } from "lucide-react";
import * as adminTaskService from "../../services/adminTaskService";
import * as employeeService from "../../services/employeeService";
import TaskFormModal from "./TaskFormModal";
import TaskDetailsModal from "./TaskDetailsModal";
import { formatDateOnly } from "../../utils/date";
import { PRIORITIES, PRIORITY_LABEL, PRIORITY_BADGE, ALL_STATUSES, STATUS_LABEL, STATUS_BADGE, isOverdue } from "../../utils/taskConstants";

export default function TaskManagement() {
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [employees, setEmployees] = useState([]);

  const [search, setSearch] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [dueTo, setDueTo] = useState("");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [formTarget, setFormTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);

  useEffect(() => {
    employeeService
      .listEmployees({ pageSize: 100, isActive: true })
      .then((res) => setEmployees(res.employees || []))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminTaskService.listTasks({
        search: search || undefined,
        employeeId: employeeId || undefined,
        status: status || undefined,
        priority: priority || undefined,
        dueTo: dueTo || undefined,
        page,
        pageSize: 10,
        sort: "due_date",
      });
      setTasks(result.tasks);
      setPagination(result.pagination);
    } catch (err) {
      setError("Unable to load tasks.");
    } finally {
      setLoading(false);
    }
  }, [search, employeeId, status, priority, dueTo, page]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSaved() {
    setFormTarget(null);
    load();
  }

  async function handleDelete(task) {
    if (!window.confirm(`Delete "${task.title}"? This can't be undone.`)) return;
    setBusyId(task.id);
    setError(null);
    try {
      await adminTaskService.removeTask(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (err) {
      setError(err.response?.data?.error || "Unable to delete this task.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div id="task-management" className="card card-pad scroll-mt-20">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
          <ClipboardList size={18} className="text-primary" /> Task Management
        </h2>
        <button className="btn-primary btn-sm" onClick={() => setFormTarget({})}>
          <Plus size={14} /> Create Task
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            className="input-field pl-9"
            placeholder="Search by title or description"
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          />
        </div>
        <select className="input-field w-48" value={employeeId} onChange={(e) => { setPage(1); setEmployeeId(e.target.value); }}>
          <option value="">All employees</option>
          {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
        </select>
        <select className="input-field w-40" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
          <option value="">All statuses</option>
          {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <select className="input-field w-36" value={priority} onChange={(e) => { setPage(1); setPriority(e.target.value); }}>
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
        </select>
        <input
          type="date"
          className="input-field w-44"
          title="Due on or before"
          value={dueTo}
          onChange={(e) => { setPage(1); setDueTo(e.target.value); }}
        />
      </div>

      {error && <div className="state-error mb-4">{error}</div>}

      {loading ? (
        <div className="state-loading">
          <RefreshCw size={16} className="animate-spin" /> Loading tasks…
        </div>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-faint py-6 text-center">No tasks match these filters.</p>
      ) : (
        <>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-faint text-xs uppercase tracking-wide">
                  <th className="px-2 py-2 font-medium">Task</th>
                  <th className="px-2 py-2 font-medium">Employee</th>
                  <th className="px-2 py-2 font-medium">Priority</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Due Date</th>
                  <th className="px-2 py-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => {
                  const overdue = isOverdue(task);
                  return (
                    <tr key={task.id} className="border-t border-line">
                      <td className="px-2 py-3 font-medium text-ink max-w-[220px] truncate">{task.title}</td>
                      <td className="px-2 py-3 text-muted whitespace-nowrap">{task.assignedTo?.name || "—"}</td>
                      <td className="px-2 py-3">
                        <span className={PRIORITY_BADGE[task.priority] || "badge-primary"}>{task.priority}</span>
                      </td>
                      <td className="px-2 py-3">
                        <span className={STATUS_BADGE[task.status] || "badge-primary"}>{STATUS_LABEL[task.status]}</span>
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap">
                        <span className={overdue ? "text-coral font-medium" : "text-muted"}>
                          {formatDateOnly(task.dueDate)}
                          {overdue ? " · Overdue" : ""}
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            className="text-faint hover:text-primary transition-colors"
                            onClick={() => setViewTarget(task)}
                            aria-label={`View ${task.title}`}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="text-faint hover:text-primary transition-colors"
                            onClick={() => setFormTarget(task)}
                            aria-label={`Edit ${task.title}`}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="text-faint hover:text-coral transition-colors disabled:opacity-40"
                            disabled={busyId === task.id}
                            onClick={() => handleDelete(task)}
                            aria-label={`Delete ${task.title}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-faint">
                Page {pagination.page} of {pagination.totalPages} · {pagination.total} tasks
              </span>
              <div className="flex gap-2">
                <button
                  className="pill !py-1 !px-3 text-xs disabled:opacity-40"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </button>
                <button
                  className="pill !py-1 !px-3 text-xs disabled:opacity-40"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {formTarget !== null && (
        <TaskFormModal
          task={Object.keys(formTarget).length ? formTarget : null}
          onClose={() => setFormTarget(null)}
          onSaved={handleSaved}
        />
      )}

      {viewTarget && <TaskDetailsModal task={viewTarget} onClose={() => setViewTarget(null)} />}
    </div>
  );
}
