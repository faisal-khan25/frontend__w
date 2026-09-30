import { api } from "../lib/api";

export async function getHolidays({ year, type } = {}) {
  const { data } = await api.get("/holidays", { params: { year, type } });
  return data;
}

export async function getUpcomingHolidays(limit = 5) {
  const { data } = await api.get("/holidays/upcoming", { params: { limit } });
  return data;
}

export async function createHoliday(payload) {
  const { data } = await api.post("/holidays", payload);
  return data;
}
export async function updateHoliday(id, payload) {
  const { data } = await api.put(`/holidays/${id}`, payload);
  return data;
}
export async function deleteHoliday(id) {
  const { data } = await api.delete(`/holidays/${id}`);
  return data;
}
