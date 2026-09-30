import { eventTypeMeta } from "./hrmsCalendarConstants";

export function normalizeEvent(ev) {
  return {
    id: `event-${ev.id}`,
    kind: "EVENT",
    title: ev.title,
    startsAt: ev.startsAt,
    endsAt: ev.endsAt,
    allDay: !!ev.allDay,
    color: ev.color || eventTypeMeta(ev.eventType).color,
    raw: ev,
  };
}

export function normalizeHoliday(h) {
  const d = new Date(`${h.date}T00:00:00`);
  const end = new Date(`${h.date}T23:59:59`);
  return {
    id: `holiday-${h.id}`,
    kind: "HOLIDAY",
    title: h.name,
    startsAt: d.toISOString(),
    endsAt: end.toISOString(),
    allDay: true,
    color: eventTypeMeta("HOLIDAY").color,
    raw: h,
  };
}

export function normalizeLeave(l) {
  const employeeName = l.employee?.name || l.employeeName || "Employee";
  const typeName = l.leaveType?.name || l.leaveTypeName || "Leave";
  return {
    id: `leave-${l.id}`,
    kind: "LEAVE",
    title: `${employeeName} — ${typeName}`,
    startsAt: new Date(`${l.fromDate}T00:00:00`).toISOString(),
    endsAt: new Date(`${l.toDate}T23:59:59`).toISOString(),
    allDay: true,
    color: eventTypeMeta("LEAVE").color,
    raw: l,
  };
}

export function normalizeBirthday(b, year, month) {
  const [, , dayStr] = (b.dateOfBirth || "").split("-");
  const day = parseInt(dayStr, 10) || 1;
  const pad = (n) => String(n).padStart(2, "0");
  const dateStr = `${year}-${pad(month)}-${pad(day)}`;
  return {
    id: `birthday-${b.id}-${year}-${pad(month)}`,
    kind: "BIRTHDAY",
    title: `🎂 ${b.name}'s Birthday`,
    startsAt: new Date(`${dateStr}T00:00:00`).toISOString(),
    endsAt: new Date(`${dateStr}T23:59:59`).toISOString(),
    allDay: true,
    color: eventTypeMeta("BIRTHDAY").color,
    raw: b,
  };
}

export function sortFeed(items) {
  return [...items].sort((a, b) => {
    const diff = new Date(a.startsAt) - new Date(b.startsAt);
    if (diff !== 0) return diff;
    if (a.allDay && !b.allDay) return -1;
    if (!a.allDay && b.allDay) return 1;
    return 0;
  });
}
