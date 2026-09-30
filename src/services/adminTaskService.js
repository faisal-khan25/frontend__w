import { api } from "../lib/api";

export async function listTasks(params = {}) {
  const { data } = await api.get("/admin/tasks", { params });
  return data;
}

export async function getTask(id) {
  const { data } = await api.get(`/admin/tasks/${id}`);
  return data;
}

export async function createTask(payload) {
  const { data } = await api.post("/admin/tasks", payload);
  return data;
}

export async function updateTask(id, payload) {
  const { data } = await api.put(`/admin/tasks/${id}`, payload);
  return data;
}

export async function reassignTask(id, assignedTo, note) {
  const { data } = await api.patch(`/admin/tasks/${id}/reassign`, { assignedTo, note });
  return data;
}

export async function removeTask(id) {
  const { data } = await api.delete(`/admin/tasks/${id}`, { params: { hard: true } });
  return data;
}
