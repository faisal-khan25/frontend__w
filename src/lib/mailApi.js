import { api } from "./api";


export const mailApi = {
  async listMail({ folder = "inbox", search, page = 1, pageSize = 20 } = {}) {
    const { data } = await api.get("/mail", { params: { folder, search, page, pageSize } });
    return data; 
  },

  async getUnreadCount() {
    const { data } = await api.get("/mail/unread-count");
    return data; 
  },

  async getMessage(id) {
    const { data } = await api.get(`/mail/${id}`);
    return data;
  },

  
  async searchContacts(search) {
    const { data } = await api.get("/mail/contacts", { params: { search } });
    return data.contacts;
  },

  async composeMessage({ to = [], cc = [], bcc = [], subject, bodyText, isDraft = false }, files = []) {
    const fd = buildFormData({ to, cc, bcc, subject, bodyText, isDraft }, files);
    const { data } = await api.post("/mail", fd, { headers: { "Content-Type": "multipart/form-data" } });
    return data;
  },

  async replyMessage(id, { bodyText, isReplyAll, bcc = [] } = {}, files = []) {
    const fd = new FormData();
    if (bodyText !== undefined) fd.append("bodyText", bodyText);
    if (isReplyAll !== undefined) fd.append("isReplyAll", String(isReplyAll));
    bcc.forEach((id) => fd.append("bcc", id));
    files.forEach((f) => fd.append("attachments", f));
    const { data } = await api.post(`/mail/${id}/reply`, fd, { headers: { "Content-Type": "multipart/form-data" } });
    return data;
  },

  async forwardMessage(id, { to = [], cc = [], bcc = [], bodyText } = {}, files = []) {
    const fd = buildFormData({ to, cc, bcc, bodyText }, files);
    const { data } = await api.post(`/mail/${id}/forward`, fd, { headers: { "Content-Type": "multipart/form-data" } });
    return data;
  },

  async updateDraft(id, { to, cc, bcc, subject, bodyText, isDraft } = {}) {
    const { data } = await api.put(`/mail/${id}`, { to, cc, bcc, subject, bodyText, isDraft });
    return data;
  },

  async setFlags(id, { isRead, isStarred } = {}) {
    const { data } = await api.patch(`/mail/${id}/flags`, { isRead, isStarred });
    return data;
  },

  async trashOrDelete(id) {
    await api.delete(`/mail/${id}`);
  },

  async restoreFromTrash(id) {
    const { data } = await api.post(`/mail/${id}/restore`);
    return data;
  },

  async markAsSpam(id) {
    const { data } = await api.patch(`/mail/${id}/spam`);
    return data;
  },

  async markAsNotSpam(id) {
    const { data } = await api.patch(`/mail/${id}/not-spam`);
    return data;
  },

  async downloadAttachment(attachmentId) {
    const { data } = await api.get(`/mail/attachments/${attachmentId}/download`, { responseType: "blob" });
    return data;
  },
};

function buildFormData({ to = [], cc = [], bcc = [], subject, bodyText, isDraft }, files = []) {
  const fd = new FormData();
  to.forEach((id) => fd.append("to", id));
  cc.forEach((id) => fd.append("cc", id));
  bcc.forEach((id) => fd.append("bcc", id));
  if (subject !== undefined) fd.append("subject", subject);
  if (bodyText !== undefined) fd.append("bodyText", bodyText);
  if (isDraft !== undefined) fd.append("isDraft", String(isDraft));
  files.forEach((f) => fd.append("attachments", f));
  return fd;
}