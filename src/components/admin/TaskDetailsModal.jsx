import Modal from "../common/Modal";
import { formatDateOnly } from "../../utils/date";
import { PRIORITY_BADGE, STATUS_BADGE, STATUS_LABEL, isOverdue } from "../../utils/taskConstants";

export default function TaskDetailsModal({ task, onClose }) {
  const overdue = isOverdue(task);

  return (
    <Modal title="Task Details" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <p className="text-xs text-faint uppercase tracking-wide">Title</p>
          <p className="text-sm font-semibold text-ink mt-0.5">{task.title}</p>
        </div>

        {task.description && (
          <div>
            <p className="text-xs text-faint uppercase tracking-wide">Description</p>
            <p className="text-sm text-muted mt-0.5 whitespace-pre-wrap">{task.description}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-faint uppercase tracking-wide">Assigned To</p>
            <p className="text-sm text-ink mt-0.5">{task.assignedTo?.name || "—"}</p>
            {task.assignedTo?.department && <p className="text-xs text-faint">{task.assignedTo.department}</p>}
          </div>
          <div>
            <p className="text-xs text-faint uppercase tracking-wide">Assigned By</p>
            <p className="text-sm text-ink mt-0.5">{task.assignedBy?.name || "—"}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={PRIORITY_BADGE[task.priority] || "badge-primary"}>{task.priority}</span>
          <span className={STATUS_BADGE[task.status] || "badge-primary"}>{STATUS_LABEL[task.status]}</span>
          {overdue && <span className="badge-coral">Overdue</span>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-faint uppercase tracking-wide">Start Date</p>
            <p className="text-sm text-ink mt-0.5">{formatDateOnly(task.startDate)}</p>
          </div>
          <div>
            <p className="text-xs text-faint uppercase tracking-wide">Due Date</p>
            <p className="text-sm text-ink mt-0.5">{formatDateOnly(task.dueDate)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-faint uppercase tracking-wide">Created</p>
            <p className="text-sm text-ink mt-0.5">{formatDateOnly(task.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-faint uppercase tracking-wide">Last Updated</p>
            <p className="text-sm text-ink mt-0.5">{formatDateOnly(task.updatedAt)}</p>
          </div>
        </div>

        {Array.isArray(task.comments) && task.comments.length > 0 && (
          <div>
            <p className="text-xs text-faint uppercase tracking-wide mb-2">Activity</p>
            <ul className="space-y-2 max-h-40 overflow-y-auto">
              {task.comments.map((c) => (
                <li key={c.id} className="rounded-lg bg-primary-50 px-3 py-2 text-xs">
                  <span className="font-semibold text-ink">{c.authorName}</span>{" "}
                  <span className="text-faint">{formatDateOnly(c.createdAt)}</span>
                  <p className="text-muted mt-0.5">{c.message}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button className="btn-outline w-full" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}
