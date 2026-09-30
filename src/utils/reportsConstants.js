export const DATE_RANGE_PRESETS = [
  { key: "", label: "All time" },
  { key: "today", label: "Today" },
  { key: "this_week", label: "This week" },
  { key: "this_month", label: "This month" },
  { key: "last_month", label: "Last month" },
  { key: "this_year", label: "This year" },
];

export const ATTENDANCE_STATUS_LABEL = {
  PRESENT: "Present",
  LATE: "Late",
  HALF_DAY: "Half day",
  WORK_FROM_HOME: "Work from home",
  ABSENT: "Absent",
  ON_LEAVE: "On leave",
};

export const ATTENDANCE_STATUS_BADGE = {
  PRESENT: "badge-mint",
  LATE: "badge-amber",
  HALF_DAY: "badge-violet",
  WORK_FROM_HOME: "badge-sky",
  ABSENT: "badge-coral",
  ON_LEAVE: "badge-primary",
};

export const ATTENDANCE_STATUSES = Object.keys(ATTENDANCE_STATUS_LABEL);

export const LEAVE_STATUS_LABEL = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export const LEAVE_STATUS_BADGE = {
  PENDING: "badge-amber",
  APPROVED: "badge-mint",
  REJECTED: "badge-coral",
  CANCELLED: "badge-primary",
};

export const LEAVE_STATUSES = Object.keys(LEAVE_STATUS_LABEL);

export const TASK_STATUS_LABEL = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const TASK_STATUS_BADGE = {
  PENDING: "badge-amber",
  IN_PROGRESS: "badge-sky",
  COMPLETED: "badge-mint",
  CANCELLED: "badge-primary",
};

export const TASK_STATUSES = Object.keys(TASK_STATUS_LABEL);

export const TASK_PRIORITY_LABEL = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export const TASK_PRIORITY_BADGE = {
  LOW: "badge-sky",
  MEDIUM: "badge-amber",
  HIGH: "badge-coral",
  URGENT: "badge-violet",
};

export const TASK_PRIORITIES = Object.keys(TASK_PRIORITY_LABEL);

export const PAYROLL_STATUS_BADGE = {
  PAID: "badge-mint",
  PENDING: "badge-amber",
  PROCESSING: "badge-sky",
  FAILED: "badge-coral",
};

export const DOCUMENT_STATUS_LABEL = {
  APPROVED: "Approved",
  PENDING: "Pending",
  REJECTED: "Rejected",
};

export const DOCUMENT_STATUS_BADGE = {
  APPROVED: "badge-mint",
  PENDING: "badge-amber",
  REJECTED: "badge-coral",
};

export const DOCUMENT_STATUSES = Object.keys(DOCUMENT_STATUS_LABEL);

export const EMPLOYEE_STATUS_BADGE = {
  ACTIVE: "badge-mint",
  INACTIVE: "badge-coral",
};

export const ROLE_BADGE = {
  ADMIN: "badge-violet",
  HR: "badge-sky",
  MANAGER: "badge-amber",
  EMPLOYEE: "badge-primary",
};

export function badgeFor(map, status) {
  return map[status] || "badge-primary";
}

export function labelFor(map, status) {
  return map[status] || status || "—";
}

export function formatCurrency(amount, currency) {
  if (amount === null || amount === undefined) return "—";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "INR" }).format(amount);
  } catch {
    return `${currency || ""} ${Number(amount).toFixed(2)}`;
  }
}
