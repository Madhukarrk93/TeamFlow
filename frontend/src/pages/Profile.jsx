import { useEffect, useState } from "react";
import {
  getCurrentUser,
  updateProfile,
  changePassword,
} from "../services/userService";

function Profile() {
  const [profileForm, setProfileForm] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    role: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [loading, setLoading] = useState(true);
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });
  const [passwordMsg, setPasswordMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const me = await getCurrentUser();
        setProfileForm({
          username: me.username || "",
          email: me.email || "",
          first_name: me.first_name || "",
          last_name: me.last_name || "",
          role: me.role || "member",
        });
      } catch (err) {
        setProfileMsg({
          type: "error",
          text: "Unable to load profile details.",
        });
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: "", text: "" });
    try {
      const updated = await updateProfile({
        username: profileForm.username.trim(),
        email: profileForm.email.trim(),
        first_name: profileForm.first_name.trim(),
        last_name: profileForm.last_name.trim(),
      });
      setProfileForm((prev) => ({ ...prev, ...updated }));
      setProfileMsg({
        type: "success",
        text: "Profile updated successfully.",
      });
    } catch (err) {
      setProfileMsg({
        type: "error",
        text: JSON.stringify(err.response?.data || "Unable to update profile."),
      });
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: "", text: "" });

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMsg({
        type: "error",
        text: "New passwords do not match.",
      });
      return;
    }

    try {
      await changePassword({
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      });
      setPasswordForm({
        old_password: "",
        new_password: "",
        confirm_password: "",
      });
      setPasswordMsg({
        type: "success",
        text: "Password changed successfully.",
      });
    } catch (err) {
      setPasswordMsg({
        type: "error",
        text:
          err.response?.data?.old_password?.[0] ||
          "Unable to change password.",
      });
    }
  };

  if (loading)
    return (
      <div className="dashboard-content">
        <p>Loading profile...</p>
      </div>
    );

  return (
    <div className="dashboard-content">
      <div className="projects-heading">
        <div>
          <h2>Account & Profile</h2>
          <p>Manage your personal information and security credentials.</p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px",
        }}
      >
        <form className="project-form" onSubmit={handleProfileSave}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3 style={{ margin: 0 }}>Profile Information</h3>
            <span
              style={{
                padding: "3px 10px",
                borderRadius: "999px",
                fontSize: "0.75rem",
                fontWeight: 700,
                backgroundColor: "#e0f2fe",
                color: "#0369a1",
                textTransform: "uppercase",
              }}
            >
              {profileForm.role}
            </span>
          </div>

          {profileMsg.text && (
            <p
              className={
                profileMsg.type === "error" ? "error-message" : "success-message"
              }
            >
              {profileMsg.text}
            </p>
          )}

          <label>Username</label>
          <input
            type="text"
            value={profileForm.username}
            onChange={(e) =>
              setProfileForm({ ...profileForm, username: e.target.value })
            }
            required
          />

          <label>Email Address</label>
          <input
            type="email"
            value={profileForm.email}
            onChange={(e) =>
              setProfileForm({ ...profileForm, email: e.target.value })
            }
          />

          <label>First Name</label>
          <input
            type="text"
            value={profileForm.first_name}
            onChange={(e) =>
              setProfileForm({ ...profileForm, first_name: e.target.value })
            }
          />

          <label>Last Name</label>
          <input
            type="text"
            value={profileForm.last_name}
            onChange={(e) =>
              setProfileForm({ ...profileForm, last_name: e.target.value })
            }
          />

          <button type="submit" className="create-project-button">
            Save Profile Changes
          </button>
        </form>

        <form className="project-form" onSubmit={handlePasswordSave}>
          <h3 style={{ margin: 0 }}>Change Password</h3>

          {passwordMsg.text && (
            <p
              className={
                passwordMsg.type === "error" ? "error-message" : "success-message"
              }
            >
              {passwordMsg.text}
            </p>
          )}

          <label>Current Password</label>
          <input
            type="password"
            value={passwordForm.old_password}
            onChange={(e) =>
              setPasswordForm({ ...passwordForm, old_password: e.target.value })
            }
            required
          />

          <label>New Password</label>
          <input
            type="password"
            value={passwordForm.new_password}
            onChange={(e) =>
              setPasswordForm({ ...passwordForm, new_password: e.target.value })
            }
            minLength={6}
            required
          />

          <label>Confirm New Password</label>
          <input
            type="password"
            value={passwordForm.confirm_password}
            onChange={(e) =>
              setPasswordForm({
                ...passwordForm,
                confirm_password: e.target.value,
              })
            }
            minLength={6}
            required
          />

          <button type="submit" className="create-project-button">
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}

export default Profile;