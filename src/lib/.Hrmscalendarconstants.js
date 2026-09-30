export const EVENT_TYPES = [
  "MEETING",
  "INTERVIEW",
  "TRAINING",
  "HOLIDAY",
  "LEAVE",
  "BIRTHDAY",
  "COMPANY_EVENT",
  "PERSONAL",
  "TASK_DEADLINE",
  "ATTENDANCE",
];

export const SYSTEM_MANAGED_TYPES = ["HOLIDAY", "LEAVE", "BIRTHDAY"];

export const STATUSES = ["SCHEDULED", "CONFIRMED", "CANCELLED", "COMPLETED"];

export const VISIBILITIES = ["PRIVATE", "TEAM", "ORGANIZATION"];

export const RSVP_STATUSES = ["ACCEPTED", "DECLINED", "TENTATIVE"];

const META = {
  MEETING: { label: "Meeting", color: "#6F66FF" },
  INTERVIEW: { label: "Interview", color: "#FF7A59" },
  TRAINING: { label: "Training", color: "#2FB4A6" },
  HOLIDAY: { label: "Holiday", color: "#F4B400" },
  LEAVE: { label: "Leave", color: "#7C8CF8" },
  BIRTHDAY: { label: "Birthday", color: "#FF6FA5" },
  COMPANY_EVENT: { label: "Company Event", color: "#3B82F6" },
  PERSONAL: { label: "Personal", color: "#9CA3AF" },
  TASK_DEADLINE: { label: "Task Deadline", color: "#EF4444" },
  ATTENDANCE: { label: "Attendance", color: "#10B981" },
};

export function eventTypeMeta(type) {
  return META[type] || { label: type || "Event", color: "#6F66FF" };
}

export const CREATABLE_TYPES_BY_ROLE = {
  ADMIN: ["MEETING", "INTERVIEW", "TRAINING", "COMPANY_EVENT", "PERSONAL", "TASK_DEADLINE", "ATTENDANCE"],
  HR: ["MEETING", "INTERVIEW", "TRAINING", "COMPANY_EVENT", "PERSONAL", "TASK_DEADLINE", "ATTENDANCE"],
  MANAGER: ["MEETING", "INTERVIEW", "TRAINING", "PERSONAL", "TASK_DEADLINE", "ATTENDANCE"],
  EMPLOYEE: ["MEETING", "PERSONAL", "TASK_DEADLINE"],
};

export const VISIBILITIES_BY_ROLE = {
  ADMIN: ["PRIVATE", "TEAM", "ORGANIZATION"],
  HR: ["PRIVATE", "TEAM", "ORGANIZATION"],
  MANAGER: ["PRIVATE", "TEAM"],
  EMPLOYEE: ["PRIVATE"],
};

export function creatableTypesForRole(role) {
  return CREATABLE_TYPES_BY_ROLE[role] || [];
}

export function visibilitiesForRole(role) {
  return VISIBILITIES_BY_ROLE[role] || ["PRIVATE"];
}

export function scopesForRole(role) {
  if (role === "ADMIN" || role === "HR") return ["mine", "team", "org"];
  if (role === "MANAGER") return ["mine", "team"];
  return ["mine"];
}

export const SCOPE_LABELS = {
  mine: "My Calendar",
  team: "Team Calendar",
  org: "Organization Calendar",
};

export const VISIBILITY_LABELS = {
  PRIVATE: "Private (invitees only)",
  TEAM: "Team",
  ORGANIZATION: "Organization",
};