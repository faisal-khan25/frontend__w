import { api } from "../lib/api";

export async function getMyProfile() {
  const { data } = await api.get("/profile/me");
  return data;
}

export async function updateBasicInfo(payload) {
  const { data } = await api.put("/profile/basic-info", payload);
  return data;
}

export async function updateProfile(payload) {
  const { data } = await api.put("/profile", payload);
  return data;
}

export async function uploadProfilePicture(file) {
  const formData = new FormData();
  formData.append("profileImage", file);
  const { data } = await api.post("/profile/picture", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function changePassword({ currentPassword, newPassword, confirmPassword }) {
  const { data } = await api.post("/profile/change-password", {
    currentPassword,
    newPassword,
    confirmPassword,
  });
  return data;
}

export async function addEducation(payload) {
  const { data } = await api.post("/profile/education", payload);
  return data;
}
export async function updateEducation(id, payload) {
  const { data } = await api.put(`/profile/education/${id}`, payload);
  return data;
}
export async function deleteEducation(id) {
  const { data } = await api.delete(`/profile/education/${id}`);
  return data;
}

export async function addSkill(payload) {
  const { data } = await api.post("/profile/skills", payload);
  return data;
}
export async function updateSkill(id, payload) {
  const { data } = await api.put(`/profile/skills/${id}`, payload);
  return data;
}
export async function deleteSkill(id) {
  const { data } = await api.delete(`/profile/skills/${id}`);
  return data;
}

export async function addExperience(payload) {
  const { data } = await api.post("/profile/experience", payload);
  return data;
}
export async function updateExperience(id, payload) {
  const { data } = await api.put(`/profile/experience/${id}`, payload);
  return data;
}
export async function deleteExperience(id) {
  const { data } = await api.delete(`/profile/experience/${id}`);
  return data;
}
