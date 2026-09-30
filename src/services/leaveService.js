import { api } from "../lib/api";

export async function getLeaveTypes() {
  const { data } = await api.get("/leaves/types");
  return data;
}

export async function getBalance(year) {
  const { data } = await api.get("/leaves/balance", { params: { year } });
  return data;
}

export async function applyLeave({ leaveTypeId, fromDate, toDate, reason }) {
  const { data } = await api.post("/leaves", { leaveTypeId, fromDate, toDate, reason });
  return data;
}

export async function getMyLeaves(status) {
  const { data } = await api.get("/leaves/my", { params: { status } });
  return data; 
}

export async function cancelLeave(id) {
  const { data } = await api.post(`/leaves/${id}/cancel`);
  return data;
}

export async function getPendingApprovals() {
  const { data } = await api.get("/leaves/pending");
  return data;
}

export async function decideLeave(id, { status, note }) {
  const { data } = await api.post(`/leaves/${id}/decide`, { status, note });
  return data;
}
