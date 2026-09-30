import { api } from "./api";

export const driveApi = {
  async listItems({ parentId, view = "all", search } = {}) {
    const { data } = await api.get("/drive", { params: { parentId, view, search } });
    return data;
  },

  async getSummary() {
    const { data } = await api.get("/drive/summary");
    return data;
  },

  async createFolder({ name, parentId } = {}) {
    const { data } = await api.post("/drive/folders", { name, parentId });
    return data;
  },

  async uploadFile(file, { parentId } = {}, onProgress) {
    const fd = new FormData();
    fd.append("file", file);
    if (parentId) fd.append("parentId", parentId);
    const { data } = await api.post("/drive/files", fd, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: onProgress
        ? (evt) => onProgress(evt.total ? Math.round((evt.loaded / evt.total) * 100) : 0)
        : undefined,
    });
    return data;
  },

  async renameItem(id, name) {
    const { data } = await api.patch(`/drive/${id}/rename`, { name });
    return data;
  },

  async moveItem(id, parentId) {
    const { data } = await api.patch(`/drive/${id}/move`, { parentId });
    return data;
  },

  async setFlags(id, { isStarred } = {}) {
    const { data } = await api.patch(`/drive/${id}/flags`, { isStarred });
    return data;
  },

  async trashOrDelete(id) {
    const { data } = await api.delete(`/drive/${id}`);
    return data;
  },

  async restoreFromTrash(id) {
    const { data } = await api.post(`/drive/${id}/restore`);
    return data;
  },

  async downloadItem(id) {
    const { data } = await api.get(`/drive/${id}/download`, { responseType: "blob" });
    return data;
  },
};