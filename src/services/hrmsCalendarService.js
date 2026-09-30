import { api } from "../lib/api";

export async function listEvents({ from, to, eventType, scope } = {}) {
  const { data } = await api.get("/calendar/events", {
    params: {
      from,
      to,
      ...(eventType ? { eventType } : {}),
      ...(scope ? { scope } : {}),
    },
  });
  return data.events || [];
}

export async function getEvent(id) {
  const { data } = await api.get(`/calendar/events/${id}`);
  return data;
}

export async function createEvent(payload) {
  const { data } = await api.post("/calendar/events", payload);
  return data;
}

export async function updateEvent(id, payload) {
  const { data } = await api.patch(`/calendar/events/${id}`, payload);
  return data;
}

export async function deleteEvent(id) {
  await api.delete(`/calendar/events/${id}`);
}

export async function addParticipants(eventId, participantIds) {
  const { data } = await api.post(`/calendar/events/${eventId}/participants`, {
    participantIds,
  });
  return data;
}

export async function updateParticipant(eventId, participantId, status) {
  const { data } = await api.patch(
    `/calendar/events/${eventId}/participants/${participantId}`,
    { status }
  );
  return data;
}

export async function listHolidays({ year, type } = {}) {
  const { data } = await api.get("/calendar/holidays", {
    params: { year, ...(type ? { type } : {}) },
  });
  return data.holidays || [];
}

export async function listLeaves({ from, to } = {}) {
  const { data } = await api.get("/calendar/leaves", {
    params: { from, to },
  });
  return data.leaves || [];
}

export async function listBirthdays({ month } = {}) {
  const { data } = await api.get("/calendar/birthdays", {
    params: { month },
  });
  return data.birthdays || [];
}
