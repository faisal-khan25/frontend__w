import { api } from "./api";

export const calendarApi = {
  async listEvents({ start, end } = {}) {
    const { data } = await api.get("/calendar/events", { params: { start, end } });
    return data;
  },

  async getEvent(id) {
    const { data } = await api.get(`/calendar/events/${id}`);
    return data;
  },

  async createEvent(payload) {
    const { data } = await api.post("/calendar/events", payload);
    return data;
  },

  async updateEvent(id, payload) {
    const { data } = await api.put(`/calendar/events/${id}`, payload);
    return data;
  },

  async deleteEvent(id) {
    await api.delete(`/calendar/events/${id}`);
  },

  async respondToEvent(id, status) {
    const { data } = await api.patch(`/calendar/events/${id}/rsvp`, { status });
    return data;
  },
};
