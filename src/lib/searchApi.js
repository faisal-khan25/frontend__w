import { api } from "./api";

export const SEARCH_MODULES = ["chat", "mail", "drive", "calendar", "employees", "meetings"];

export const searchApi = {
  async globalSearch(q, limit = 5) {
    const { data } = await api.get("/search", { params: { q, limit } });
    return data;
  },

  async searchModule(module, q, page = 1, limit = 20) {
    const { data } = await api.get(`/search/${module}`, { params: { q, page, limit } });
    return data;
  },
};
