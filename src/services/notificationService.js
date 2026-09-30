import { api } from "../lib/api";

export async function getMyNotifications(params = {}) {
  const { data } = await api.get("/notifications", { params });
  return data;
}

export async function markAsRead(id) {
  const { data } = await api.post(`/notifications/${id}/read`);
  return data;
}

export async function markAllAsRead() {
  const { data } = await api.post("/notifications/read-all");
  return data;
}

export async function deleteNotification(id) {
  const { data } = await api.delete(`/notifications/${id}`);
  return data;
}

export async function broadcastAnnouncement(payload) {
  const { data } = await api.post("/notifications/broadcast", payload);
  return data;
}
