import API from "./api";

export const registerUser = async (userData) => {
  const response = await API.post("register/", userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await API.post("login/", credentials);

  if (response.data.token) {
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("user", JSON.stringify({
      id: response.data.user_id,
      username: response.data.username,
      role: response.data.role,
    }));
  }

  return response.data;
};

export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};
