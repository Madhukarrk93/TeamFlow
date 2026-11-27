import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../services/projectService";
import { getTasks } from "../services/taskService";
import { getUsers } from "../services/userService";

const INITIAL_FORM = {
  name: "",
  description: "",
  manager: "",
};

function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [searchTerm, setSearchTerm] = useState("");
  const [progressFilter, setProgressFilter] = useState("all");

  const loadData = async () => {
    try {
      setError("");
      const [projectsData, tasksData, usersData] = await Promise.all([
        getProjects(),
        getTasks(),
        getUsers(),
      ]);
      setProjects(projectsData);
      setTasks(tasksData);
      setUsers(usersData);
    } catch (err) {
      setError("Unable to load projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => setFormData(INITIAL_FORM);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      ...(formData.manager ? { manager: Number(formData.manager) } : {}),
    };

    try {
      setError("");
      if (formData.id) {
        await updateProject(formData.id, payload);
      } else {
        await createProject(payload);
      }
      resetForm();
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(JSON.stringify(err.response?.data || err.message));
    }
  };

  const handleEdit = (project) => {
    setFormData({
      id: project.id,
      name: project.name,
      description: project.description || "",
      manager: project.manager ? String(project.manager) : "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this project and its associated tasks?")) return;
    try {
      await deleteProject(id);
      await loadData();
    } catch (err) {
      setError("Unable to delete project.");
    }
  };

  const getProjectStats = (projectId) => {
    const projectTasks = tasks.filter((t) => t.project === projectId);
    const total = projectTasks.length;
    const completed = projectTasks.filter((t) => t.status === "complete").length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const { total, percent } = getProjectStats(project.id);

    if (progressFilter === "completed")
      return matchesSearch && total > 0 && percent === 100;
    if (progressFilter === "active") return matchesSearch && percent < 100;
    return matchesSearch;
  });

  return (
    <div className="dashboard-content">
      <div className="projects-heading">
        <div>
          <h2>Projects</h2>
          <p>Track project progress, task distribution, and team ownership.</p>
        </div>

        <button
          type="button"
          className="create-project-button"
          onClick={() => {
            if (showForm) resetForm();
            setShowForm(!showForm);
          }}
        >
          {showForm ? "Close Form" : "+ Create Project"}
        </button>
      </div>

      {showForm && (
        <form className="project-form" onSubmit={handleSubmit}>
          <h3>{formData.id ? "Edit Project" : "Create New Project"}</h3>

          <input
            type="text"
            name="name"
            placeholder="Project Name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />

          <textarea
            name="description"
            placeholder="Project Description"
            value={formData.description}
            onChange={handleInputChange}
          />

          <label>Project Manager</label>
          <select
            name="manager"
            value={formData.manager}
            onChange={handleInputChange}
          >
            <option value="">Default / Current User</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username} ({u.role})
              </option>
            ))}
          </select>

          <div className="project-form-actions">
            <button type="submit" className="create-project-button">
              {formData.id ? "Update Project" : "Save Project"}
            </button>
            <button
              type="button"
              className="cancel-project-button"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading && <p>Loading projects...</p>}
      {error && <p className="error-message">{error}</p>}

      {!loading && !error && (
        <>
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginBottom: "18px",
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                minWidth: "220px",
              }}
            />

            <select
              value={progressFilter}
              onChange={(e) => setProgressFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
              }}
            >
              <option value="all">All Projects ({projects.length})</option>
              <option value="active">Active / In Progress</option>
              <option value="completed">100% Completed</option>
            </select>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "16px",
            }}
          >
            {filteredProjects.length === 0 ? (
              <p>No projects found.</p>
            ) : (
              filteredProjects.map((project) => {
                const stats = getProjectStats(project.id);
                const managerName =
                  users.find((u) => u.id === project.manager)?.username ||
                  "Assigned";

                return (
                  <div
                    key={project.id}
                    className="project-card"
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderTop: "4px solid #3b82f6",
                      borderRadius: "10px",
                      padding: "18px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "14px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "6px",
                        }}
                      >
                        <h3 style={{ margin: 0 }}>{project.name}</h3>
                        <span
                          style={{
                            padding: "2px 10px",
                            borderRadius: "999px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            backgroundColor:
                              stats.percent === 100 && stats.total > 0
                                ? "#dcfce7"
                                : "#e0f2fe",
                            color:
                              stats.percent === 100 && stats.total > 0
                                ? "#15803d"
                                : "#0369a1",
                          }}
                        >
                          {stats.percent}% Done
                        </span>
                      </div>

                      <p
                        style={{
                          color: "#475569",
                          fontSize: "0.9rem",
                          margin: "6px 0 12px",
                        }}
                      >
                        {project.description || "No description provided."}
                      </p>

                      <div
                        style={{
                          fontSize: "0.82rem",
                          color: "#64748b",
                          marginBottom: "10px",
                        }}
                      >
                        <strong>Manager:</strong> {managerName} ·{" "}
                        <strong>Tasks:</strong> {stats.completed}/{stats.total}{" "}
                        completed
                      </div>

                      <div
                        style={{
                          height: "8px",
                          backgroundColor: "#e2e8f0",
                          borderRadius: "999px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${stats.percent}%`,
                            height: "100%",
                            backgroundColor:
                              stats.percent === 100 ? "#16a34a" : "#3b82f6",
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        borderTop: "1px solid #f1f5f9",
                        paddingTop: "12px",
                      }}
                    >
                      <button
                        type="button"
                        className="create-project-button"
                        style={{ padding: "6px 12px", fontSize: "0.84rem" }}
                        onClick={() => navigate(`/tasks?project=${project.id}`)}
                      >
                        View Tasks ({stats.total})
                      </button>

                      <div className="project-actions">
                        <button
                          type="button"
                          onClick={() => handleEdit(project)}
                          className="edit-button"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(project.id)}
                          className="delete-button"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Projects;