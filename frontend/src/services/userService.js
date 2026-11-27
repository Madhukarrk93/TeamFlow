
import api from "./api";

export const getUsers = async () => {
  const response = await api.get("/users/");
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get("/users/me/");
  return response.data;
};

export const updateUserRole = async (userId, role) => {
  const response = await api.patch(`/users/${userId}/`, { role });
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await api.patch("/users/me/", profileData);
  return response.data;
};

export const changePassword = async (passwordData) => {
  const response = await api.post("/users/change-password/", passwordData);
  return response.data;
};