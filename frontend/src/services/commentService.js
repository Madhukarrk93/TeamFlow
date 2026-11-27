import api from "./api";

export const getTaskComments = async (taskId) => {
  const response = await api.get("/comments/", {
    params: { task: taskId },
  });
  return response.data;
};

export const createTaskComment = async (commentData) => {
  const response = await api.post("/comments/", commentData);
  return response.data;
};

export const deleteTaskComment = async (commentId) => {
  await api.delete(`/comments/${commentId}/`);
};