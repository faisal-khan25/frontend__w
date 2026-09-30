import axios from "axios";

// Local dev: "/api/v1" (Vite proxies /api and /socket.io to the local backend).
// Production: VITE_API_BASE_URL=https://union-hrms-workspace-b.onrender.com/api/v1
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/+$/, "");

// Backend origin (no /api/v1). Empty string means "same origin as the page" (Vite dev proxy).
export const API_ORIGIN = /^https?:\/\//i.test(API_BASE_URL)
  ? new URL(API_BASE_URL).origin
  : "";

// Socket.IO server origin. Override with VITE_SOCKET_URL if it ever differs from the API origin.
export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || API_ORIGIN || window.location.origin;

// Turns a backend-relative upload path ("/uploads/...") into an absolute URL when the API
// lives on another origin. Absolute URLs, data:/blob: URLs and emoji strings pass through.
export function assetUrl(value) {
  if (typeof value === "string" && API_ORIGIN && value.startsWith("/uploads/")) {
    return `${API_ORIGIN}${value}`;
  }
  return value;
}

// The backend stores/returns image paths like "/uploads/profile-pictures/x.png". In production the
// frontend and backend are different origins, so <img src="/uploads/..."> would hit the static site.
// Rewrite those URL-ish fields once here (API responses + socket payloads) instead of in every component.
const ASSET_KEY_RE = /(image|avatar|photo|picture|url|logo)$/i;

export function normalizeAssetUrls(value, key) {
  if (!API_ORIGIN) return value;

  if (typeof value === "string") {
    return key && ASSET_KEY_RE.test(key) ? assetUrl(value) : value;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      value[i] = normalizeAssetUrls(value[i], key);
    }
    return value;
  }
  if (value && typeof value === "object") {
    const proto = Object.getPrototypeOf(value);
    if (proto === Object.prototype || proto === null) {
      for (const k of Object.keys(value)) {
        value[k] = normalizeAssetUrls(value[k], k);
      }
    }
  }
  return value;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let refreshQueue = [];

function resolveQueue(error, token) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  refreshQueue = [];
}

api.interceptors.response.use(
  (response) => {
    response.data = normalizeAssetUrls(response.data);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (
      status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/")
    ) {
      return Promise.reject(error);
    }

    const storedRefreshToken = localStorage.getItem("refreshToken");
    if (!storedRefreshToken) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/auth/refresh-token`,
        { refreshToken: storedRefreshToken }
      );

      localStorage.setItem("token", data.token);
      if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);

      resolveQueue(null, data.token);
      originalRequest.headers.Authorization = `Bearer ${data.token}`;
      return api(originalRequest);
    } catch (refreshError) {
      resolveQueue(refreshError, null);
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;

export const dashboardApi = {
  async getMyDashboard() {
    const { data } = await api.get("/dashboard/workspace");
    return data;
  },
};

export async function requestDemo(payload) {
  const { data } = await api.post("/demo", payload);
  return data;
}