import API from "./api";

export const getDashboardData = async () => {
  const [projectsResponse, tasksResponse] = await Promise.all([
    API.get("projects/"),
    API.get("tasks/"),
  ]);

  const projects = projectsResponse.data;
  const tasks = tasksResponse.data;

  const completedTasks = tasks.filter(
    (task) => task.status === "complete"
  );

  const pendingTasks = tasks.filter(
    (task) => task.status !== "complete"
  );

  return {
    totalProjects: projects.length,
    totalTasks: tasks.length,
    completedTasks: completedTasks.length,
    pendingTasks: pendingTasks.length,
  };
};