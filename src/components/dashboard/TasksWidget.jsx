import { useEffect, useState, useCallback } from "react";
import { ListChecks, Plus, RefreshCw, Pencil, Trash2, ArrowRight, AlertTriangle } from "lucide-react";
import * as taskService from "../../services/taskService";
import AddTaskModal from "./AddTaskModal";
import { formatDateOnly } from "../../utils/date";
import {
  PRIORITY_BADGE,
  STATUS_LABEL,
  STATUS_BADGE,
  NEXT_STATUS,
  NEXT_STATUS_ACTION_LABEL,
  isOverdue,
} from "../../utils/taskConstants";

const FILTERS = ["ALL", "PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE"];

const FILTER_LABEL = {
  ALL: "All",
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  OVERDUE: "Overdue",
};

export default function TasksWidget() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await taskService.getMyTasks();
      setTasks(result);
    } catch (err) {
      setError("Unable to load tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleSaved(task) {
    setModalOpen(false);
    setEditingTask(null);
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === task.id);
      return exists ? prev.map((t) => (t.id === task.id ? task : t)) : [task, ...prev];
    });
  }

  function openEdit(task) {
    setEditingTask(task);
    setModalOpen(true);
  }

  function openCreate() {
    setEditingTask(null);
    setModalOpen(true);
  }

  async function handleAdvanceStatus(task) {
    const nextStatus = NEXT_STATUS[task.status];
    if (!nextStatus) return;
    setBusyId(task.id);
    setError(null);
    try {
      const updated = await taskService.updateTaskStatus(task.id, nextStatus);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err) {
      setError(err.response?.data?.error || "Unable to update task status.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(task) {
    setBusyId(task.id);
    setError(null);
    try {
      await taskService.deleteTask(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    } catch (err) {
      setError(err.response?.data?.error || "Unable to delete this task.");
    } finally {
      setBusyId(null);
    }
  }

  const visibleTasks = tasks.filter((t) => {
    if (filter === "ALL") return true;
    if (filter === "OVERDUE") return isOverdue(t);
    return t.status === filter;
  });

  const openCount = tasks.filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS").length;
  const overdueCount = tasks.filter(isOverdue).length;

  return (
    <div id="tasks" className="card card-pad scroll-mt-20">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
          <ListChecks size={18} className="text-primary" /> My Tasks
          {!loading && (
            <span className="badge-primary !px-2 !py-0.5 text-[11px]">{openCount} open</span>
          )}
          {!loading && overdueCount > 0 && (
            <span className="badge-coral !px-2 !py-0.5 text-[11px]">{overdueCount} overdue</span>
          )}
        </h2>
        <button className="btn-primary btn-sm" onClick={openCreate}>
          <Plus size={14} /> New Personal Task
        </button>
      </div>

      {error && <div className="state-error mb-4">{error}</div>}

      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`pill !py-1 !px-3 text-xs ${filter === f ? "!border-primary !text-primary-700 !bg-primary-50" : ""}`}
          >
            {FILTER_LABEL[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="state-loading">
          <RefreshCw size={16} className="animate-spin" /> Loading tasks…
        </div>
      ) : visibleTasks.length === 0 ? (
        <p className="text-sm text-faint py-6 text-center">
          {filter === "ALL" ? "No tasks yet. Your admin hasn't assigned you anything." : "Nothing here."}
        </p>
      ) : (
        <ul className="space-y-2">
          {visibleTasks.map((task) => {
            const overdue = isOverdue(task);
            const isSelfCreated = !task.assignedBy;
            const nextAction = NEXT_STATUS_ACTION_LABEL[task.status];

            return (
              <li
                key={task.id}
                className={`rounded-xl border px-4 py-3 ${overdue ? "border-coral/40 bg-coral-bg/40" : "border-line"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold text-ink truncate ${task.status === "COMPLETED" ? "line-through text-faint" : ""}`}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-muted mt-0.5 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center flex-wrap gap-2 mt-1.5">
                      <span className={PRIORITY_BADGE[task.priority] || "badge-primary"}>{task.priority}</span>
                      <span className={STATUS_BADGE[task.status] || "badge-primary"}>{STATUS_LABEL[task.status]}</span>
                      {task.startDate && (
                        <span className="text-xs text-faint">Starts {formatDateOnly(task.startDate)}</span>
                      )}
                      {task.dueDate && (
                        <span className={`text-xs flex items-center gap-1 ${overdue ? "text-coral font-medium" : "text-faint"}`}>
                          {overdue && <AlertTriangle size={12} />}
                          Due {formatDateOnly(task.dueDate)}
                          {overdue ? " · Overdue" : ""}
                        </span>
                      )}
                      {task.assignedBy && (
                        <span className="text-xs text-faint">Assigned by {task.assignedBy.name}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isSelfCreated && (
                      <>
                        <button
                          onClick={() => openEdit(task)}
                          disabled={busyId === task.id}
                          className="p-1.5 rounded-lg text-faint hover:text-primary hover:bg-primary-50 disabled:opacity-50"
                          aria-label="Edit task"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(task)}
                          disabled={busyId === task.id}
                          className="p-1.5 rounded-lg text-faint hover:text-coral hover:bg-coral-bg disabled:opacity-50"
                          aria-label="Delete task"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {nextAction && (
                  <div className="mt-3">
                    <button
                      onClick={() => handleAdvanceStatus(task)}
                      disabled={busyId === task.id}
                      className="btn-outline btn-sm"
                    >
                      {nextAction} <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {modalOpen && (
        <AddTaskModal
          task={editingTask}
          onClose={() => {
            setModalOpen(false);
            setEditingTask(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
