import { api } from "./api";

export const meetApi = {

  async listMyMeetings({ status, page = 1, pageSize = 20 } = {}) {
    const { data } = await api.get("/meet", {
      params: { status, page, pageSize },
    });
    return data;
  },

  async getMeetingHistory({ page = 1, pageSize = 20 } = {}) {
    const { data } = await api.get("/meet/history", {
      params: { page, pageSize },
    });
    return data;
  },

  async getMeeting(id) {
    const { data } = await api.get(`/meet/${id}`);
    return data;
  },

  async createMeeting({ title, conversationId, scheduledAt } = {}) {
    const { data } = await api.post("/meet", { title, conversationId, scheduledAt });
    return data;
  },

  async startMeeting(id) {
    const { data } = await api.post(`/meet/${id}/start`);
    return data;
  },

  async endMeeting(id) {
    const { data } = await api.post(`/meet/${id}/end`);
    return data;
  },

  async joinMeeting(id) {
    const { data } = await api.post(`/meet/${id}/join`);
    return data;
  },

  async leaveMeeting(id) {
    const { data } = await api.post(`/meet/${id}/leave`);
    return data;
  },

  async updateMediaState(id, { isCameraOn, isMicOn, isScreenSharing } = {}) {
    const { data } = await api.patch(`/meet/${id}/media`, {
      isCameraOn,
      isMicOn,
      isScreenSharing,
    });
    return data;
  },

  async inviteToMeeting(id, userIds = []) {
    const { data } = await api.post(`/meet/${id}/invite`, { userIds });
    return data;
  },
};
