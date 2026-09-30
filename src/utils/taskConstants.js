export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export const SETTABLE_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED"];

export const ALL_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE", "CANCELLED"];

export const PRIORITY_LABEL = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const PRIORITY_BADGE = {
  LOW: "badge-sky",
  MEDIUM: "badge-amber",
  HIGH: "badge-coral",
  URGENT: "badge-violet",
};

export const STATUS_LABEL = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  OVERDUE: "Overdue",
  CANCELLED: "Cancelled",
};

export const STATUS_BADGE = {
  PENDING: "badge-amber",
  IN_PROGRESS: "badge-sky",
  COMPLETED: "badge-mint",
  OVERDUE: "badge-coral",
  CANCELLED: "badge-primary",
};

export const NEXT_STATUS = {
  PENDING: "IN_PROGRESS",
  IN_PROGRESS: "COMPLETED",
};

export const NEXT_STATUS_ACTION_LABEL = {
  PENDING: "Start Task",
  IN_PROGRESS: "Mark Complete",
};

export function isOverdue(task) {
  if (!task?.dueDate) return false;
  if (task.status === "COMPLETED" || task.status === "CANCELLED") return false;

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(task.dueDate);
  if (!match) return false;
  const [, y, m, d] = match;
  const due = new Date(Number(y), Number(m) - 1, Number(d));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}
