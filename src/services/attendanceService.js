import { api } from "../lib/api";

function getDeviceInfo() {
  if (typeof navigator === "undefined") return undefined;
  return navigator.userAgent;
}

function getLocation() {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(undefined);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(`${pos.coords.latitude},${pos.coords.longitude}`),
      () => resolve(undefined),
      { timeout: 4000 }
    );
  });
}

export async function punchIn() {
  const location = await getLocation();
  const { data } = await api.post("/attendance/punch-in", {
    location,
    deviceInfo: getDeviceInfo(),
  });
  return data;
}

export async function punchOut() {
  const { data } = await api.post("/attendance/punch-out");
  return data;
}

export async function getToday() {
  const { data } = await api.get("/attendance/today");
  return data;
}

export async function getMonthlySummary({ month, year } = {}) {
  const { data } = await api.get("/attendance/summary", { params: { month, year } });
  return data;
}

export async function getHistory({ from, to } = {}) {
  const { data } = await api.get("/attendance/history", { params: { from, to } });
  return data;
}
