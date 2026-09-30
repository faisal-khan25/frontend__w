import { api } from "./api";

export const chatApi = {
  async listConversations({ type, search } = {}) {
    const { data } = await api.get("/chat/conversations", { params: { type, search } });
    return data.conversations;
  },

  async getConversation(id) {
    const { data } = await api.get(`/chat/conversations/${id}`);
    return data;
  },

  async createDirectConversation(userId) {
    const { data } = await api.post("/chat/conversations/direct", { userId });
    return data;
  },

  async createGroupConversation({ name, memberIds }) {
    const { data } = await api.post("/chat/conversations/group", { name, memberIds });
    return data;
  },

  async updateConversation(id, payload) {
    const { data } = await api.put(`/chat/conversations/${id}`, payload);
    return data;
  },

  async leaveConversation(id) {
    await api.delete(`/chat/conversations/${id}`);
  },

  async listMessages(conversationId, { before, limit = 30 } = {}) {
    const { data } = await api.get(`/chat/conversations/${conversationId}/messages`, {
      params: { before, limit },
    });
    return data;
  },

  async sendMessage(conversationId, { content, replyToMessageId, mentionedUserIds } = {}) {
    const { data } = await api.post(`/chat/conversations/${conversationId}/messages`, {
      content,
      replyToMessageId,
      mentionedUserIds,
    });
    return data;
  },

  async sendAttachmentMessage(conversationId, file, { caption, onUploadProgress, signal } = {}) {
    const fd = new FormData();
    fd.append("file", file);
    if (caption) fd.append("caption", caption);
    const { data } = await api.post(`/chat/conversations/${conversationId}/messages/attachment`, fd, {
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

  async markConversationRead(conversationId, messageId) {
    const { data } = await api.post(`/chat/conversations/${conversationId}/read`, { messageId });
    return data;
  },

  async editMessage(messageId, content) {
    const { data } = await api.put(`/chat/messages/${messageId}`, { content });
    return data;
  },

  async deleteMessage(messageId) {
    await api.delete(`/chat/messages/${messageId}`);
  },

  async addReaction(messageId, emoji) {
    const { data } = await api.post(`/chat/messages/${messageId}/reactions`, { emoji });
    return data;
  },

  async removeReaction(messageId, reactionId) {
    await api.delete(`/chat/messages/${messageId}/reactions/${reactionId}`);
  },

  async starMessage(messageId) {
    const { data } = await api.post(`/chat/messages/${messageId}/star`);
    return data;
  },

  async unstarMessage(messageId) {
    const { data } = await api.delete(`/chat/messages/${messageId}/star`);
    return data;
  },

  async listStarredMessages() {
    const { data } = await api.get("/chat/conversations/starred-messages");
    return data.messages;
  },

  async pinMessage(conversationId, messageId) {
    const { data } = await api.post(`/chat/conversations/${conversationId}/pinned/${messageId}`);
    return data;
  },

  async unpinMessage(conversationId, messageId) {
    await api.delete(`/chat/conversations/${conversationId}/pinned/${messageId}`);
  },

  async listPinnedMessages(conversationId) {
    const { data } = await api.get(`/chat/conversations/${conversationId}/pinned`);
    return data.messages;
  },

  async searchMessages(q, { signal } = {}) {
    const { data } = await api.get("/chat/conversations/search", { params: { q }, signal });
    return data.messages;
  },

  async searchContacts(q, { signal } = {}) {
    const { data } = await api.get("/chat/search", { params: { q }, signal });
    return data;
  },

  async downloadAttachment(attachmentId) {
    const { data } = await api.get(`/chat/attachments/${attachmentId}/download`, {
      responseType: "blob",
    });
    return data;
  },
};

export default chatApi;