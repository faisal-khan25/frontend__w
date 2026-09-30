import { api } from "../lib/api";

export async function getMyPayslips(year) {
  const { data } = await api.get("/payroll/my", { params: { year } });
  return data;
}

export async function getMyPayslip(id) {
  const { data } = await api.get(`/payroll/my/${id}`);
  return data;
}

export async function downloadMyPayslipLegacy(id) {
  const { data } = await api.get(`/payroll/my/${id}/download`, { responseType: "blob" });
  return data;
}

export async function getSalaryStructure(employeeId) {
  const { data } = await api.get(`/admin/salary-structures/${employeeId}`);
  return data;
}

export async function saveSalaryStructure(employeeId, payload, { isRevision } = {}) {
  if (isRevision) {
    const { data } = await api.put(`/admin/salary-structures/${employeeId}`, payload);
    return data;
  }
  const { data } = await api.post("/admin/salary-structures", { employeeId, ...payload });
  return data;
}

export async function calculatePayrollPreview(payload) {
  const { data } = await api.post("/admin/payroll/calculate", payload);
  return data;
}

export async function createPayroll(payload) {
  const { data } = await api.post("/admin/payroll", payload);
  return data;
}

export async function listPayroll(params = {}) {
  const { data } = await api.get("/admin/payroll", { params });
  return data;
}

export async function getPayroll(id) {
  const { data } = await api.get(`/admin/payroll/${id}`);
  return data;
}

export async function updatePayroll(id, payload) {
  const { data } = await api.put(`/admin/payroll/${id}`, payload);
  return data;
}

export async function approvePayroll(id) {
  const { data } = await api.post(`/admin/payroll/${id}/approve`);
  return data;
}

export async function finalizePayroll(id) {
  const { data } = await api.post(`/admin/payroll/${id}/finalize`);
  return data;
}

export async function generatePayslip(id) {
  const { data } = await api.post(`/admin/payroll/${id}/generate-payslip`);
  return data;
}

export async function markPayrollPaid(id, payload) {
  const { data } = await api.post(`/admin/payroll/${id}/mark-paid`, payload);
  return data;
}

export async function downloadAdminPayslip(id) {
  const { data } = await api.get(`/admin/payroll/${id}/payslip/download`, { responseType: "blob" });
  return data;
}

export async function getMyPayrollHistory(year) {
  const { data } = await api.get("/employee/payroll", { params: { year } });
  return data;
}

export async function getMyPayrollDetail(id) {
  const { data } = await api.get(`/employee/payroll/${id}`);
  return data;
}

export async function downloadMyFullPayslip(id) {
  const { data } = await api.get(`/employee/payroll/${id}/payslip/download`, { responseType: "blob" });
  return data;
}

export function triggerBlobDownload(blob, fileName) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function getSalarySlip(id) {
  const { data } = await api.get(`/payroll/${id}/salary-slip`);
  return data;
}

export async function downloadSalarySlipPdf(id) {
  try {
    const { data } = await api.get(`/payroll/${id}/salary-slip/pdf`, { responseType: "blob" });
    return data;
  } catch (err) {
    if (err.response?.data instanceof Blob) {
      try {
        err.response.data = JSON.parse(await err.response.data.text());
      } catch {
      }
    }
    throw err;
  }
}
