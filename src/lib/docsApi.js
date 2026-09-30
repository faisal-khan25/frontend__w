import { api } from "./api";

export const docsApi = {
  async listDocs(params = {}) {
    const { data } = await api.get("/docs", { params });
    return data;
  },
  async getDoc(id) {
    const { data } = await api.get(`/docs/${id}`);
    return data;
  },
  async createDoc({ name, parentId } = {}) {
    const { data } = await api.post("/docs", { name, parentId });
    return data;
  },
  async updateDocContent(id, content) {
    const { data } = await api.put(`/docs/${id}/content`, { content });
    return data;
  },
  async renameDoc(id, name) {
    const { data } = await api.put(`/docs/${id}/rename`, { name });
    return data;
  },
  async deleteDoc(id) {
    await api.delete(`/docs/${id}`);
  },
};

export const sheetsApi = {
  async listSheets(params = {}) {
    const { data } = await api.get("/sheets", { params });
    return data;
  },
  async getSheet(id) {
    const { data } = await api.get(`/sheets/${id}`);
    return data;
  },
  async createSheet({ name, parentId } = {}) {
    const { data } = await api.post("/sheets", { name, parentId });
    return data;
  },
  async updateSheetContent(id, { cells, sheetNames } = {}) {
    const { data } = await api.put(`/sheets/${id}/content`, { cells, sheetNames });
    return data;
  },
  async renameSheet(id, name) {
    const { data } = await api.put(`/sheets/${id}/rename`, { name });
    return data;
  },
  async deleteSheet(id) {
    await api.delete(`/sheets/${id}`);
  },
};

export const slidesApi = {
  async listDecks(params = {}) {
    const { data } = await api.get("/slides", { params });
    return data;
  },
  async getDeck(id) {
    const { data } = await api.get(`/slides/${id}`);
    return data;
  },
  async createDeck({ name, parentId } = {}) {
    const { data } = await api.post("/slides", { name, parentId });
    return data;
  },
  async updateDeckContent(id, slides) {
    const { data } = await api.put(`/slides/${id}/content`, { slides });
    return data;
  },
  async renameDeck(id, name) {
    const { data } = await api.put(`/slides/${id}/rename`, { name });
    return data;
  },
  async deleteDeck(id) {
    await api.delete(`/slides/${id}`);
  },
};