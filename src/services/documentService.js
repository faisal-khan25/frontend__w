import { api } from "../lib/api";

export async function getMyDocuments(category) {
  const { data } = await api.get("/documents/my", { params: category ? { category } : {} });
  return data;
}

export async function uploadDocument(file, { title, category } = {}) {
  const formData = new FormData();
  formData.append("file", file);
  if (title) formData.append("title", title);
  if (category) formData.append("category", category);

  const { data } = await api.post("/documents", formData, {
    headers: { "Content-Type": undefined },
  });
  return data;
}

export async function downloadDocument(id, fileName) {
  const response = await api.get(`/documents/${id}/download`, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName || "document";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function deleteDocument(id) {
  await api.delete(`/documents/${id}`);
}
