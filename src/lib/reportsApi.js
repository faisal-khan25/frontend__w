import { api } from "./api";


export const reportsApi = {
  
  async getDashboard() {
    const { data } = await api.get("/workspace/reports/dashboard");
    return data; 
  },

  
  async getEmployeeReport(filters = {}) {
    const { data } = await api.get("/workspace/reports/employees", { params: filters });
    return data; 
  },

  
  async getAttendanceReport(filters = {}) {
    const { data } = await api.get("/workspace/reports/attendance", { params: filters });
    return data; 
  },

  
  async getLeaveReport(filters = {}) {
    const { data } = await api.get("/workspace/reports/leave", { params: filters });
    return data; 
  },

  
  async getTaskReport(filters = {}) {
    const { data } = await api.get("/workspace/reports/tasks", { params: filters });
    return data; 
  },

  
  async getPayrollReport(filters = {}) {
    const { data } = await api.get("/workspace/reports/payroll", { params: filters });
    return data; 
  },

  
  async getDepartmentReport(filters = {}) {
    const { data } = await api.get("/workspace/reports/departments", { params: filters });
    return data; 
  },

  
  async getDocumentReport(filters = {}) {
    const { data } = await api.get("/workspace/reports/documents", { params: filters });
    return data; 
  },

  
  async getCustomReportMeta() {
    const { data } = await api.get("/workspace/reports/custom/meta");
    return data; 
  },

  
  async runCustomReport({ category, fields, filters, page, pageSize } = {}) {
    const { data } = await api.post("/workspace/reports/custom", { category, fields, filters, page, pageSize });
    return data; 
  },

  
  async exportReport(type, filters = {}) {
    const response = await api.get("/workspace/reports/export", {
      params: { type, ...filters },
      responseType: "blob",
    });
    
    const disposition = response.headers?.["content-disposition"] || "";
    const match = /filename="?([^"]+)"?/.exec(disposition);
    const fileName = match?.[1] || `${type}-report.csv`;
    return { blob: response.data, fileName };
  },
};
