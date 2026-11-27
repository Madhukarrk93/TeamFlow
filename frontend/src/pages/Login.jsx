import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "member",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      if (isRegister) {
        await api.post("/register/", {
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role,
        });
        setSuccess("Account created! Sign in with your new credentials.");
        setIsRegister(false);
        setFormData((prev) => ({ ...prev, password: "" }));
      } else {
        const res = await api.post("/login/", {
          username: formData.username.trim(),
          password: formData.password,
        });
        localStorage.setItem("access", res.data.access);
        if (res.data.refresh) {
          localStorage.setItem("refresh", res.data.refresh);
        }
        navigate("/dashboard");
      }
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        JSON.stringify(err.response?.data || "Authentication failed.");
      setError(detail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        backgroundColor: "#0f172a",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          padding: "28px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
        }}
      >
        <h1 style={{ margin: "0 0 4px", fontSize: "1.6rem", color: "#0f172a" }}>
          TeamFlow
        </h1>
        <p style={{ margin: "0 0 20px", color: "#64748b", fontSize: "0.9rem" }}>
          {isRegister
            ? "Create a workspace account"
            : "Sign in to your project workspace"}
        </p>

        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "0.95rem",
            }}
            required
          />

          {isRegister && (
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.95rem",
              }}
              required
            />
          )}

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "0.95rem",
            }}
            required
          />

          {isRegister && (
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.95rem",
              }}
            >
              <option value="member">Member</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          )}

          <button
            type="submit"
            className="create-project-button"
            disabled={submitting}
            style={{ padding: "10px", fontSize: "0.95rem", marginTop: "4px" }}
          >
            {submitting
              ? "Please wait..."
              : isRegister
              ? "Create Account"
              : "Sign In"}
          </button>
        </form>

        <div
          style={{
            marginTop: "16px",
            textAlign: "center",
            fontSize: "0.88rem",
            color: "#475569",
          }}
        >
          {isRegister ? "Already have an account?" : "Need an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError("");
              setSuccess("");
            }}
            style={{
              border: "none",
              background: "none",
              color: "#2563eb",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {isRegister ? "Sign In" : "Register"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;