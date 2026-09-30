import { api } from "./api";

export const STATUS_TYPES = [
  { value: "MEETING", label: "In a meeting" },
  { value: "BUSY", label: "Busy" },
  { value: "DO_NOT_DISTURB", label: "Do not disturb" },
  { value: "AWAY", label: "Away" },
  { value: "CUSTOM", label: "Custom message" },
];

export const statusApi = {
  async setMyStatus({ statusType, message, startTime, endTime }) {
    const { data } = await api.post("/status", { statusType, message, startTime, endTime });
    return data;
  },

  async getMyStatus() {
    const { data } = await api.get("/status/me");
    return data.status;
  },

  async clearMyStatus() {
    const { data } = await api.delete("/status/me");
    return data;
  },

  async getUserStatus(userId) {
    const { data } = await api.get(`/status/${userId}`);
    return data.status;
  },

  async getBulkStatuses(userIds) {
    if (!userIds || !userIds.length) return {};
    const { data } = await api.post("/status/bulk", { userIds });
    return data.statuses;
  },
};

export default statusApi;