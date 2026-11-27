import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../services/taskService";
import { getProjects } from "../services/projectService";
import { getUsers } from "../services/userService";
import {
  getTaskComments,
  createTaskComment,
  deleteTaskComment,
} from "../services/commentService";

const INITIAL_FORM = {
  title: "",
  description: "",
  project: "",
  assigned_to: "",
  priority: "medium",
  status: "todo",
  due_date: "",
};

const COLUMNS = [
  { key: "todo", label: "To Do", accent: "#64748b", bg: "#f1f5f9", text: "#334155" },
  { key: "in_progress", label: "In Progress", accent: "#0284c7", bg: "#e0f2fe", text: "#0369a1" },
  { key: "in_review", label: "In Review", accent: "#d97706", bg: "#fef3c7", text: "#b45309" },
  { key: "complete", label: "Complete", accent: "#16a34a", bg: "#dcfce7", text: "#15803d" },
];

const PRIORITIES = {
  urgent: { label: "Urgent", bg: "#fee2e2", text: "#b91c1c", border: "#fca5a5" },
  high: { label: "High", bg: "#ffedd5", text: "#c2410c", border: "#fdba74" },
  medium: { label: "Medium", bg: "#dbeafe", text: "#1d4ed8", border: "#93c5fd" },
  low: { label: "Low", bg: "#f1f5f9", text: "#475569", border: "#cbd5e1" },
};

const INPUT_STYLE = {
  padding: "8px 12px",
  borderRadius: "8px",
  border: "1px solid #cbd5e1",
  backgroundColor: "#ffffff",
  color: "#1e293b",
  fontSize: "0.9rem",
};

const pillStyle = (bg, text, border = "transparent") => ({
  padding: "2px 9px",
  borderRadius: "999px",
  fontSize: "0.74rem",
  fontWeight: 700,
  backgroundColor: bg,
  color: text,
  border: `1px solid ${border}`,
});

function Tasks() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [viewMode, setViewMode] = useState("list");
  const [dragOverCol, setDragOverCol] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState(
    searchParams.get("project") || "all"
  );
  const [sortBy, setSortBy] = useState("default");

  const [activeCommentTask, setActiveCommentTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);

  const fetchTasks = async () => {
    try {
      setError("");
      const data = await getTasks();
      setTasks(data);
    } catch (err) {
      setError("Unable to load tasks.");
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError("");
      try {
        const [tasksData, projectsData, usersData] = await Promise.all([
          getTasks(),
          getProjects(),
          getUsers(),
        ]);
        setTasks(tasksData);
        setProjects(projectsData);
        setUsers(usersData);
      } catch (err) {
        setError("Unable to load tasks, projects, or team members.");
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const resetForm = () => setFormData(INITIAL_FORM);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const buildPayload = (data) => ({
    title: data.title.trim(),
    description: data.description.trim(),
    project: Number(data.project),
    assigned_to: data.assigned_to ? Number(data.assigned_to) : null,
    priority: data.priority,
    status: data.status,
    due_date: data.due_date || null,
  });

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      setError("");
      await createTask(buildPayload(formData));
      resetForm();
      setShowForm(false);
      await fetchTasks();
    } catch (err) {
      setError(JSON.stringify(err.response?.data || err.message));
    }
  };

  const handleEdit = (task) => {
    setFormData({
      id: task.id,
      title: task.title,
      description: task.description || "",
      project: String(task.project),
      assigned_to: task.assigned_to ? String(task.assigned_to) : "",
      priority: task.priority,
      status: task.status,
      due_date: task.due_date || "",
    });
    setError("");
    setShowForm(true);
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      setError("");
      await updateTask(formData.id, buildPayload(formData));
      resetForm();
      setShowForm(false);
      await fetchTasks();
    } catch (err) {
      setError(JSON.stringify(err.response?.data || err.message));
    }
  };

  const handleQuickStatusChange = async (task, newStatus) => {
    if (task.status === newStatus) return;
    try {
      setError("");
      await updateTask(task.id, {
        title: task.title,
        description: task.description || "",
        project: task.project,
        assigned_to: task.assigned_to || null,
        priority: task.priority,
        status: newStatus,
        due_date: task.due_date || null,
      });
      await fetchTasks();
    } catch (err) {
      setError("Unable to update task status.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      setError("");
      await deleteTask(id);
      await fetchTasks();
    } catch (err) {
      setError("Unable to delete task.");
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setProjectFilter("all");
    setSortBy("default");
    if (searchParams.get("project")) setSearchParams({});
  };

  // Comments Handlers
  const openComments = async (task) => {
    setActiveCommentTask(task);
    setLoadingComments(true);
    try {
      const data = await getTaskComments(task.id);
      setComments(data);
    } catch (err) {
      setError("Unable to load comments.");
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !activeCommentTask) return;
    try {
      const created = await createTaskComment({
        task: activeCommentTask.id,
        text: newComment.trim(),
      });
      setComments((prev) => [...prev, created]);
      setNewComment("");
    } catch (err) {
      setError("Unable to post comment.");
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteTaskComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      setError("Unable to delete comment.");
    }
  };

  const isTaskOverdue = (task) => {
    if (!task.due_date || task.status === "complete") return false;
    const today = new Date().toISOString().split("T")[0];
    return task.due_date < today;
  };

  const getProjectName = (id) =>
    projects.find((p) => p.id === id)?.name || "Unknown Project";

  const getAssigneeName = (id) =>
    id ? users.find((u) => u.id === id)?.username || "Unknown User" : "Unassigned";

  // Summary Stats
  const totalCount = tasks.length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const completedCount = tasks.filter((t) => t.status === "complete").length;
  const overdueCount = tasks.filter((t) => isTaskOverdue(t)).length;
  const completionPct =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Filter + Sort
  const filteredTasks = tasks
    .filter((task) => {
      const matchesSearch = task.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || task.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || task.priority === priorityFilter;
      const matchesProject =
        projectFilter === "all" || String(task.project) === projectFilter;
      return matchesSearch && matchesStatus && matchesPriority && matchesProject;
    })
    .sort((a, b) => {
      if (sortBy === "due_asc") {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      }
      if (sortBy === "due_desc") {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(b.due_date) - new Date(a.due_date);
      }
      return 0;
    });

  return (
    <div className="dashboard-content">
      {/* Header + View Switcher */}
      <div className="projects-heading" style={{ flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2>Tasks</h2>
          <p>Manage, filter, and track all your TeamFlow tasks.</p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div
            style={{
              display: "inline-flex",
              backgroundColor: "#e2e8f0",
              padding: "4px",
              borderRadius: "8px",
              gap: "4px",
            }}
          >
            {["list", "board"].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  backgroundColor: viewMode === mode ? "#ffffff" : "transparent",
                  color: viewMode === mode ? "#0f172a" : "#475569",
                  boxShadow: viewMode === mode ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {mode === "list" ? "List View" : "Kanban Board"}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="create-project-button"
            onClick={() => {
              if (showForm) resetForm();
              setShowForm(!showForm);
            }}
          >
            {showForm ? "Close Form" : "+ Create Task"}
          </button>
        </div>
      </div>

      {/* Summary Stats Bar */}
      {!loading && !error && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
            gap: "14px",
            marginBottom: "20px",
          }}
        >
          {[
            { label: "TOTAL TASKS", value: totalCount, border: "#3b82f6", color: "#0f172a" },
            { label: "IN PROGRESS", value: inProgressCount, border: "#0284c7", color: "#0369a1" },
            {
              label: `COMPLETED (${completionPct}%)`,
              value: completedCount,
              border: "#16a34a",
              color: "#15803d",
              bar: completionPct,
            },
            {
              label: "OVERDUE",
              value: overdueCount,
              border: "#dc2626",
              color: overdueCount > 0 ? "#dc2626" : "#0f172a",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderLeft: `4px solid ${stat.border}`,
                borderRadius: "10px",
                padding: "14px 16px",
              }}
            >
              <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 700 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: "1.6rem", fontWeight: 700, color: stat.color }}>
                {stat.value}
              </div>
              {stat.bar !== undefined && (
                <div
                  style={{
                    marginTop: "6px",
                    height: "6px",
                    backgroundColor: "#e2e8f0",
                    borderRadius: "999px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${stat.bar}%`,
                      height: "100%",
                      backgroundColor: "#16a34a",
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Task Form */}
      {showForm && (
        <form
          className="project-form"
          onSubmit={formData.id ? handleUpdateTask : handleCreateTask}
        >
          <h3>{formData.id ? "Edit Task" : "Create New Task"}</h3>

          <input
            type="text"
            name="title"
            placeholder="Task Title"
            value={formData.title}
            onChange={handleInputChange}
            required
          />

          <textarea
            name="description"
            placeholder="Task Description"
            value={formData.description}
            onChange={handleInputChange}
          />

          <label>Select Project</label>
          <select
            name="project"
            value={formData.project}
            onChange={handleInputChange}
            required
          >
            <option value="">Choose a project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <label>Assign To</label>
          <select
            name="assigned_to"
            value={formData.assigned_to || ""}
            onChange={handleInputChange}
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username} ({u.role})
              </option>
            ))}
          </select>

          <label>Priority</label>
          <select name="priority" value={formData.priority} onChange={handleInputChange}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <label>Status</label>
          <select name="status" value={formData.status} onChange={handleInputChange}>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="in_review">In Review</option>
            <option value="complete">Complete</option>
          </select>

          <label>Due Date</label>
          <input
            type="date"
            name="due_date"
            value={formData.due_date}
            onChange={handleInputChange}
          />

          <div className="project-form-actions">
            <button type="submit" className="create-project-button">
              {formData.id ? "Update Task" : "Save Task"}
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

      {loading && <p>Loading tasks...</p>}
      {error && <p className="error-message">{error}</p>}

      {!loading && !error && (
        <>
          {/* Filter Bar */}
          <div
            className="task-filters"
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "14px",
              padding: "14px",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              placeholder="Search tasks by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ ...INPUT_STYLE, minWidth: "200px", flex: "1 1 200px" }}
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={INPUT_STYLE}
            >
              <option value="all">All Statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="complete">Complete</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={INPUT_STYLE}
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              style={INPUT_STYLE}
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={INPUT_STYLE}
            >
              <option value="default">Sort: Default</option>
              <option value="due_asc">Due Date: Earliest First</option>
              <option value="due_desc">Due Date: Latest First</option>
            </select>

            <button
              type="button"
              className="cancel-project-button"
              onClick={handleClearFilters}
            >
              Clear Filters
            </button>
          </div>

          <p style={{ marginBottom: "14px", fontSize: "0.88rem", color: "#64748b" }}>
            Showing <strong>{filteredTasks.length}</strong> of{" "}
            <strong>{tasks.length}</strong> tasks
            {viewMode === "board" && " · Drag cards between columns to update status"}
          </p>

          {/* LIST VIEW */}
          {viewMode === "list" && (
            <div className="task-list">
              {filteredTasks.length === 0 ? (
                <p>No tasks found.</p>
              ) : (
                filteredTasks.map((task) => {
                  const pMeta = PRIORITIES[task.priority] || PRIORITIES.medium;
                  const sMeta =
                    COLUMNS.find((c) => c.key === task.status) || COLUMNS[0];
                  const overdue = isTaskOverdue(task);

                  return (
                    <div
                      className="task-card"
                      key={task.id}
                      style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e2e8f0",
                        borderLeft: `4px solid ${sMeta.accent}`,
                        borderRadius: "10px",
                        padding: "16px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            flexWrap: "wrap",
                            marginBottom: "6px",
                          }}
                        >
                          <h3 style={{ margin: 0 }}>{task.title}</h3>
                          <span style={pillStyle(pMeta.bg, pMeta.text, pMeta.border)}>
                            {pMeta.label}
                          </span>
                          <span style={pillStyle(sMeta.bg, sMeta.text)}>
                            {sMeta.label}
                          </span>
                          {overdue && (
                            <span style={pillStyle("#fee2e2", "#dc2626")}>
                              Overdue
                            </span>
                          )}
                        </div>

                        <p style={{ margin: "4px 0 10px", color: "#475569" }}>
                          {task.description || "No description available"}
                        </p>

                        <div
                          style={{
                            display: "flex",
                            gap: "16px",
                            flexWrap: "wrap",
                            alignItems: "center",
                            fontSize: "0.85rem",
                            color: "#475569",
                          }}
                        >
                          <span>
                            <strong>Project:</strong> {getProjectName(task.project)}
                          </span>
                          <span>
                            <strong>Assigned:</strong>{" "}
                            {getAssigneeName(task.assigned_to)}
                          </span>
                          <span style={{ color: overdue ? "#dc2626" : "inherit" }}>
                            <strong>Due:</strong> {task.due_date || "Not set"}
                          </span>

                          <label
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <strong>Move:</strong>
                            <select
                              value={task.status}
                              onChange={(e) =>
                                handleQuickStatusChange(task, e.target.value)
                              }
                              style={{
                                padding: "4px 8px",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                                fontSize: "0.82rem",
                              }}
                            >
                              <option value="todo">To Do</option>
                              <option value="in_progress">In Progress</option>
                              <option value="in_review">In Review</option>
                              <option value="complete">Complete</option>
                            </select>
                          </label>
                        </div>
                      </div>

                      <div className="project-actions">
                        <button
                          type="button"
                          onClick={() => openComments(task)}
                          className="edit-button"
                          style={{ backgroundColor: "#e0f2fe", color: "#0369a1" }}
                        >
                          Comments
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(task)}
                          className="edit-button"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(task.id)}
                          className="delete-button"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* KANBAN BOARD VIEW */}
          {viewMode === "board" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "16px",
                alignItems: "start",
              }}
            >
              {COLUMNS.map((col) => {
                const colTasks = filteredTasks.filter((t) => t.status === col.key);
                const isTarget = dragOverCol === col.key;

                return (
                  <div
                    key={col.key}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (dragOverCol !== col.key) setDragOverCol(col.key);
                    }}
                    onDragLeave={() => setDragOverCol(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverCol(null);
                      const taskId = Number(e.dataTransfer.getData("taskId"));
                      const dragged = tasks.find((t) => t.id === taskId);
                      if (dragged) handleQuickStatusChange(dragged, col.key);
                    }}
                    style={{
                      backgroundColor: isTarget ? "#eff6ff" : "#f8fafc",
                      border: isTarget
                        ? `2px dashed ${col.accent}`
                        : "1px solid #e2e8f0",
                      borderTop: `4px solid ${col.accent}`,
                      borderRadius: "10px",
                      padding: "12px",
                      minHeight: "340px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <h4 style={{ margin: 0, fontSize: "0.95rem", color: "#0f172a" }}>
                        {col.label}
                      </h4>
                      <span style={pillStyle(col.bg, col.text)}>
                        {colTasks.length}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      {colTasks.length === 0 ? (
                        <div
                          style={{
                            padding: "20px 12px",
                            textAlign: "center",
                            fontSize: "0.82rem",
                            color: "#94a3b8",
                            border: "1px dashed #cbd5e1",
                            borderRadius: "8px",
                          }}
                        >
                          No tasks in {col.label}
                        </div>
                      ) : (
                        colTasks.map((task) => {
                          const pMeta =
                            PRIORITIES[task.priority] || PRIORITIES.medium;
                          const overdue = isTaskOverdue(task);

                          return (
                            <div
                              key={task.id}
                              draggable
                              onDragStart={(e) =>
                                e.dataTransfer.setData("taskId", String(task.id))
                              }
                              style={{
                                backgroundColor: "#ffffff",
                                border: "1px solid #e2e8f0",
                                borderRadius: "8px",
                                padding: "12px",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                cursor: "grab",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  gap: "6px",
                                  flexWrap: "wrap",
                                  marginBottom: "6px",
                                }}
                              >
                                <span
                                  style={pillStyle(
                                    pMeta.bg,
                                    pMeta.text,
                                    pMeta.border
                                  )}
                                >
                                  {pMeta.label}
                                </span>
                                {overdue && (
                                  <span style={pillStyle("#fee2e2", "#dc2626")}>
                                    Overdue
                                  </span>
                                )}
                              </div>

                              <h4
                                style={{
                                  margin: "0 0 4px",
                                  fontSize: "0.95rem",
                                  color: "#0f172a",
                                }}
                              >
                                {task.title}
                              </h4>

                              {task.description && (
                                <p
                                  style={{
                                    margin: "0 0 8px",
                                    fontSize: "0.82rem",
                                    color: "#64748b",
                                  }}
                                >
                                  {task.description}
                                </p>
                              )}

                              <div
                                style={{
                                  fontSize: "0.78rem",
                                  color: "#475569",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "2px",
                                  marginBottom: "10px",
                                }}
                              >
                                <span>
                                  <strong>Project:</strong>{" "}
                                  {getProjectName(task.project)}
                                </span>
                                <span>
                                  <strong>Assignee:</strong>{" "}
                                  {getAssigneeName(task.assigned_to)}
                                </span>
                                {task.due_date && (
                                  <span
                                    style={{
                                      color: overdue ? "#dc2626" : "inherit",
                                    }}
                                  >
                                    <strong>Due:</strong> {task.due_date}
                                  </span>
                                )}
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  gap: "6px",
                                  borderTop: "1px solid #f1f5f9",
                                  paddingTop: "8px",
                                  flexWrap: "wrap",
                                }}
                              >
                                <select
                                  value={task.status}
                                  onChange={(e) =>
                                    handleQuickStatusChange(task, e.target.value)
                                  }
                                  style={{
                                    padding: "3px 6px",
                                    borderRadius: "6px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "0.78rem",
                                  }}
                                >
                                  <option value="todo">To Do</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="in_review">In Review</option>
                                  <option value="complete">Complete</option>
                                </select>

                                <div style={{ display: "flex", gap: "4px" }}>
                                  <button
                                    type="button"
                                    onClick={() => openComments(task)}
                                    className="edit-button"
                                    style={{
                                      padding: "4px 6px",
                                      fontSize: "0.75rem",
                                      backgroundColor: "#e0f2fe",
                                      color: "#0369a1",
                                    }}
                                  >
                                    Chat
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleEdit(task)}
                                    className="edit-button"
                                    style={{
                                      padding: "4px 6px",
                                      fontSize: "0.75rem",
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(task.id)}
                                    className="delete-button"
                                    style={{
                                      padding: "4px 6px",
                                      fontSize: "0.75rem",
                                    }}
                                  >
                                    Del
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* COMMENTS MODAL */}
      {activeCommentTask && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "20px",
              width: "100%",
              maxWidth: "480px",
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0 }}>Comments: {activeCommentTask.title}</h3>
              <button
                type="button"
                className="cancel-project-button"
                onClick={() => {
                  setActiveCommentTask(null);
                  setComments([]);
                  setNewComment("");
                }}
              >
                Close
              </button>
            </div>

            <div
              style={{
                overflowY: "auto",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {loadingComments ? (
                <p>Loading comments...</p>
              ) : comments.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
                  No comments yet. Start the discussion below.
                </p>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      padding: "10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.78rem",
                        color: "#64748b",
                      }}
                    >
                      <strong>{c.author_name}</strong>
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(c.id)}
                        style={{
                          border: "none",
                          background: "none",
                          color: "#dc2626",
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: "0.9rem",
                        color: "#0f172a",
                      }}
                    >
                      {c.text}
                    </p>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={handleAddComment}
              style={{ display: "flex", gap: "8px" }}
            >
              <input
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                }}
                required
              />
              <button type="submit" className="create-project-button">
                Post
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tasks;