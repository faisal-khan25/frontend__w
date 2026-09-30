import { api } from "../lib/api";

export async function getMyTasks(status) {
  const { data } = await api.get("/tasks/my", { params: status ? { status } : {} });
  return data;
}

export async function getTask(id) {
  const { data } = await api.get(`/tasks/${id}`);
  return data;
}

export async function createTask({ title, description, dueDate, priority }) {
  const { data } = await api.post("/tasks", { title, description, dueDate, priority });
  return data;
}

export async function updateTask(id, { title, description, dueDate, priority }) {
  const { data } = await api.patch(`/tasks/${id}`, { title, description, dueDate, priority });
  return data;
}

export async function updateTaskStatus(id, status) {
  const { data } = await api.patch(`/tasks/${id}/status`, { status });
  return data;
}

export async function addComment(id, message) {
  const { data } = await api.post(`/tasks/${id}/comments`, { message });
  return data;
}

export async function deleteTask(id) {
  await api.delete(`/tasks/${id}`);
}
