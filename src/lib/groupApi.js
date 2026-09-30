import { api } from "./api";


export const groupApi = {
  

  async listGroups({ search } = {}) {
    const { data } = await api.get("/groups", { params: { search } });
    
    return { groups: data.groups, canCreateGroup: Boolean(data.canCreateGroup) };
  },

  async getGroup(groupId) {
    const { data } = await api.get(`/groups/${groupId}`);
    return data;
  },

  async createGroup({ name, description, icon, memberIds }) {
    const { data } = await api.post("/groups", {
      name,
      description,
      icon,
      memberIds,
    });
    return data;
  },

  async updateGroup(groupId, payload) {
    const { data } = await api.put(`/groups/${groupId}`, payload);
    return data;
  },

  async deleteGroup(groupId) {
    const { data } = await api.delete(`/groups/${groupId}`);
    return data;
  },

  async uploadIcon(groupId, file) {
    const form = new FormData();
    form.append("icon", file);
    const { data } = await api.post(`/groups/${groupId}/icon`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  

  async listMembers(groupId, { includeInactive = false } = {}) {
    const { data } = await api.get(`/groups/${groupId}/members`, {
      params: { includeInactive: includeInactive || undefined },
    });
    return data.members;
  },

  async addMembers(groupId, memberIds) {
    const { data } = await api.post(`/groups/${groupId}/members`, { memberIds });
    return data.members;
  },

  async removeMember(groupId, userId) {
    const { data } = await api.delete(`/groups/${groupId}/members/${userId}`);
    return data.members;
  },

  async changeMemberRole(groupId, userId, role) {
    const { data } = await api.put(`/groups/${groupId}/members/${userId}/role`, {
      role,
    });
    return data.members;
  },

  async leaveGroup(groupId) {
    const { data } = await api.post(`/groups/${groupId}/leave`);
    return data;
  },

  

  async listMessages(groupId, { before, limit = 30 } = {}) {
    const { data } = await api.get(`/groups/${groupId}/messages`, {
      params: { before, limit },
    });
    return data; 
  },

  async sendMessage(groupId, { message, messageType = "TEXT" } = {}) {
    const { data } = await api.post(`/groups/${groupId}/messages`, {
      message,
      messageType,
    });
    return data;
  },

  
  async sendAttachmentMessage(groupId, file, { caption, onUploadProgress, signal } = {}) {
    const form = new FormData();
    form.append("file", file);
    if (caption) form.append("caption", caption);
    const { data } = await api.post(`/groups/${groupId}/messages/attachment`, form, {
      headers: { "Content-Type": "multipart/form-data" },
      signal,
      onUploadProgress: (evt) => {
        if (onUploadProgress && evt.total) {
          onUploadProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      },
    });
    return data;
  },

  async downloadAttachment(groupId, messageId) {
    const { data } = await api.get(`/groups/${groupId}/messages/${messageId}/attachment`, {
      responseType: "blob",
    });
    return data;
  },

  async markRead(groupId) {
    const { data } = await api.post(`/groups/${groupId}/read`);
    return data;
  },

  async deleteMessage(messageId) {
    const { data } = await api.delete(`/groups/messages/${messageId}`);
    return data;
  },

  async searchMessages(q, groupId) {
    const { data } = await api.get("/groups/messages/search", {
      params: { q, groupId },
    });
    return data.messages;
  },

  
  async searchPeople(q, { groupId } = {}) {
    const { data } = await api.get("/groups/people", { params: { q, groupId } });
    return data.people;
  },
};

export default groupApi;
