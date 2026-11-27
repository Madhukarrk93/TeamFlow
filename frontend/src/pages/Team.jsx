import { useEffect, useState } from "react";
import {
  getUsers,
  getCurrentUser,
  updateUserRole,
} from "../services/userService";
import { getTasks } from "../services/taskService";
import { getProjects } from "../services/projectService";

const ROLE_STYLES = {
  admin: { label: "Admin", bg: "#f3e8ff", text: "#7e22ce", border: "#d8b4fe" },
  manager: { label: "Manager", bg: "#e0f2fe", text: "#0369a1", border: "#7dd3fc" },
  member: { label: "Member", bg: "#f1f5f9", text: "#334155", border: "#cbd5e1" },
};

function Team() {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [expandedUserId, setExpandedUserId] = useState(null);

  useEffect(() => {
    const loadTeamData = async () => {
      try {
        const [usersData, tasksData, projectsData, meData] = await Promise.all([
          getUsers(),
          getTasks(),
          getProjects(),
          getCurrentUser(),
        ]);
        setUsers(usersData);
        setTasks(tasksData);
        setProjects(projectsData);
        setCurrentUser(meData);
      } catch (err) {
        setError("Unable to load team members.");
      } finally {
        setLoading(false);
      }
    };
    loadTeamData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      setError("");
      setSuccessMsg("");
      const updated = await updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: updated.role } : u))
      );
      setSuccessMsg(`Updated role for ${updated.username} to ${updated.role}.`);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to update role. Admin privileges required."
      );
    }
  };

  const isAdmin = currentUser?.role === "admin";

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading)
    return (
      <div className="dashboard-content">
        <p>Loading team directory...</p>
      </div>
    );

  return (
    <div className="dashboard-content">
      <div className="projects-heading">
        <div>
          <h2>Team & Roles</h2>
          <p>
            View workspace members, inspect task assignments, and manage access
            roles.
          </p>
        </div>
      </div>

      {error && <p className="error-message">{error}</p>}
      {successMsg && <p className="success-message">{successMsg}</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "14px",
          marginBottom: "20px",
        }}
      >
        {[
          { label: "TOTAL MEMBERS", value: users.length, accent: "#3b82f6" },
          {
            label: "ADMINS",
            value: users.filter((u) => u.role === "admin").length,
            accent: "#9333ea",
          },
          {
            label: "MANAGERS",
            value: users.filter((u) => u.role === "manager").length,
            accent: "#0284c7",
          },
          {
            label: "MEMBERS",
            value: users.filter((u) => u.role === "member").length,
            accent: "#64748b",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderLeft: `4px solid ${stat.accent}`,
              borderRadius: "10px",
              padding: "14px 16px",
            }}
          >
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b" }}>
              {stat.label}
            </div>
            <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "#0f172a" }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div
        className="task-filters"
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "18px",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Search by username or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ minWidth: "240px" }}
        />

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="member">Member</option>
        </select>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
          gap: "16px",
        }}
      >
        {filteredUsers.map((member) => {
          const roleMeta = ROLE_STYLES[member.role] || ROLE_STYLES.member;
          const memberTasks = tasks.filter((t) => t.assigned_to === member.id);
          const activeTasks = memberTasks.filter((t) => t.status !== "complete");
          const completedTasks = memberTasks.filter(
            (t) => t.status === "complete"
          );
          const isExpanded = expandedUserId === member.id;

          return (
            <div
              key={member.id}
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "18px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
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
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "999px",
                      backgroundColor: "#e2e8f0",
                      color: "#0f172a",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1rem",
                    }}
                  >
                    {member.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1rem" }}>
                      {member.username}{" "}
                      {currentUser?.id === member.id && (
                        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          (You)
                        </span>
                      )}
                    </h3>
                    <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
                      {member.email || "No email provided"}
                    </span>
                  </div>
                </div>

                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: "999px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    backgroundColor: roleMeta.bg,
                    color: roleMeta.text,
                    border: `1px solid ${roleMeta.border}`,
                  }}
                >
                  {roleMeta.label}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  fontSize: "0.84rem",
                  color: "#475569",
                  backgroundColor: "#f8fafc",
                  padding: "8px 12px",
                  borderRadius: "8px",
                }}
              >
                <span>
                  <strong>Total:</strong> {memberTasks.length}
                </span>
                <span>
                  <strong>Active:</strong> {activeTasks.length}
                </span>
                <span>
                  <strong>Done:</strong> {completedTasks.length}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "8px",
                  borderTop: "1px solid #f1f5f9",
                  paddingTop: "10px",
                }}
              >
                {isAdmin && currentUser?.id !== member.id ? (
                  <label style={{ fontSize: "0.82rem", color: "#475569" }}>
                    Role:{" "}
                    <select
                      value={member.role}
                      onChange={(e) =>
                        handleRoleChange(member.id, e.target.value)
                      }
                      style={{
                        padding: "4px 8px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                      }}
                    >
                      <option value="member">Member</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>
                ) : (
                  <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                    {isAdmin ? "Current admin" : "View only"}
                  </span>
                )}

                <button
                  type="button"
                  className="cancel-project-button"
                  style={{ padding: "5px 10px", fontSize: "0.8rem" }}
                  onClick={() =>
                    setExpandedUserId(isExpanded ? null : member.id)
                  }
                >
                  {isExpanded
                    ? "Hide Tasks"
                    : `Inspect Tasks (${memberTasks.length})`}
                </button>
              </div>

              {isExpanded && (
                <div
                  style={{
                    borderTop: "1px solid #e2e8f0",
                    paddingTop: "10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {memberTasks.length === 0 ? (
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "#94a3b8" }}>
                      No tasks assigned.
                    </p>
                  ) : (
                    memberTasks.map((t) => {
                      const projName =
                        projects.find((p) => p.id === t.project)?.name ||
                        "Project";
                      return (
                        <div
                          key={t.id}
                          style={{
                            fontSize: "0.82rem",
                            padding: "6px 8px",
                            backgroundColor: "#f8fafc",
                            borderRadius: "6px",
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span>
                            <strong>{t.title}</strong> · {projName}
                          </span>
                          <span style={{ color: "#64748b" }}>{t.status}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Team;