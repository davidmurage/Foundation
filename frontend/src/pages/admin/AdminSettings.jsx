import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../utils/config";

import AdminSidebar from "../../components/admin/AdminSidebar";
import "../../styles/admin/AdminLayoutBase.css";
import "../../styles/admin/AdminSettings.css";

export default function AdminSettings() {
  const token = localStorage.getItem("token");

  const [activeTab, setActiveTab] = useState("profile");

  // --------- STATE ---------
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    avatarUrl: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [system, setSystem] = useState({
    systemName: "KCB Foundation Scholarship Portal",
    academicYear: "",
    minGpa: 2.0,
    maxDocsPerStudent: 10,
    portalStatus: "open",
    notificationEmail: "",
  });

  const [notifications, setNotifications] = useState({
    notifyAdminOnNewStudent: true,
    notifyAdminOnNewDocument: true,
    notifyStudentOnApproval: true,
    sendProfileReminder: true,
    sendMissingDocsReminder: false,
  });

  const [security, setSecurity] = useState({
    enforceStrongPassword: true,
    sessionTimeoutMinutes: 60,
    allowTwoFactorAuth: false,
    maxUploadSizeMb: 5,
    allowedFileTypes: "pdf",
  });

  const [logs, setLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // --------- LOAD ALL SETTINGS ---------
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setMessage("");

      try {
        const headers = { Authorization: `Bearer ${token}` };

        const [
          profileRes,
          systemRes,
          notificationsRes,
          securityRes,
          logsRes,
        ] = await Promise.all([
          axios.get(`${API_URL}/api/admin/settings/profile`, { headers }),
          axios.get(`${API_URL}/api/admin/settings/system`, { headers }),
          axios.get(`${API_URL}/api/admin/settings/notifications`, { headers }),
          axios.get(`${API_URL}/api/admin/settings/security`, { headers }),
          axios.get(`${API_URL}/api/admin/settings/logs`, { headers }),
        ]);

        if (profileRes.data) {
          setProfile({
            fullName: profileRes.data.fullName || "",
            email: profileRes.data.email || "",
            avatarUrl: profileRes.data.avatarUrl || "",
          });
        }

        if (systemRes.data) setSystem((prev) => ({ ...prev, ...systemRes.data }));
        if (notificationsRes.data)
          setNotifications((prev) => ({ ...prev, ...notificationsRes.data }));
        if (securityRes.data)
          setSecurity((prev) => ({ ...prev, ...securityRes.data }));
        if (Array.isArray(logsRes.data)) setLogs(logsRes.data);
      } catch (err) {
        console.error("LOAD SETTINGS ERROR:", err);
        setMessage(
          err.response?.data?.message || "Failed to load settings. Using defaults."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [token]);

  const headers = { Authorization: `Bearer ${token}` };

  // --------- HANDLERS ---------

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await axios.put(
        `${API_URL}/api/admin/settings/profile`,
        profile,
        { headers }
      );
      setMessage("Profile updated successfully.");
    } catch (err) {
      console.error("SAVE PROFILE ERROR:", err);
      setMessage(err.response?.data?.message || "Error updating profile.");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage("New password and confirmation do not match.");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      await axios.put(
        `${API_URL}/api/admin/settings/change-password`,
        passwordForm,
        { headers }
      );
      setMessage("Password changed successfully.");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error("CHANGE PASSWORD ERROR:", err);
      setMessage(err.response?.data?.message || "Error changing password.");
    } finally {
      setSaving(false);
    }
  };

  const saveSystem = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await axios.put(
        `${API_URL}/api/admin/settings/system`,
        system,
        { headers }
      );
      setMessage("System settings updated.");
    } catch (err) {
      console.error("SAVE SYSTEM ERROR:", err);
      setMessage(err.response?.data?.message || "Error saving system settings.");
    } finally {
      setSaving(false);
    }
  };

  const saveNotifications = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await axios.put(
        `${API_URL}/api/admin/settings/notifications`,
        notifications,
        { headers }
      );
      setMessage("Notification settings updated.");
    } catch (err) {
      console.error("SAVE NOTIFICATIONS ERROR:", err);
      setMessage(
        err.response?.data?.message || "Error saving notification settings."
      );
    } finally {
      setSaving(false);
    }
  };

  const saveSecurity = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await axios.put(
        `${API_URL}/api/admin/settings/security`,
        security,
        { headers }
      );
      setMessage("Security settings updated.");
    } catch (err) {
      console.error("SAVE SECURITY ERROR:", err);
      setMessage(
        err.response?.data?.message || "Error saving security settings."
      );
    } finally {
      setSaving(false);
    }
  };

  // --------- RENDER HELPERS ---------

  const renderProfileTab = () => (
    <section className="settings-panel">
      <h3>Profile Settings</h3>
      <p className="settings-subtitle">
        Update your admin account details and password.
      </p>

      <div className="settings-two-column">
        {/* Profile form */}
        <form onSubmit={saveProfile} className="settings-card">
          <h4>Account details</h4>

          <div className="form-grid-2">
            <div className="form-field">
              <label>Full name</label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) =>
                  setProfile({ ...profile, fullName: e.target.value })
                }
                required
              />
            </div>
            <div className="form-field">
              <label>Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) =>
                  setProfile({ ...profile, email: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="form-field">
            <label>Avatar URL (optional)</label>
            <input
              type="text"
              value={profile.avatarUrl}
              onChange={(e) =>
                setProfile({ ...profile, avatarUrl: e.target.value })
              }
              placeholder="https://..."
            />
          </div>

          <button className="save-btn" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save profile"}
          </button>
        </form>

        {/* Change password form */}
        <form onSubmit={changePassword} className="settings-card">
          <h4>Change password</h4>

          <div className="form-field">
            <label>Current password</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  currentPassword: e.target.value,
                })
              }
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="form-field">
              <label>New password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="form-field">
              <label>Confirm password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value,
                  })
                }
                required
              />
            </div>
          </div>

          <button className="save-btn secondary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Change password"}
          </button>
        </form>
      </div>
    </section>
  );

  const renderSystemTab = () => (
    <section className="settings-panel">
      <h3>System Settings</h3>
      <p className="settings-subtitle">
        Configure global settings for the student sponsorship portal.
      </p>

      <form onSubmit={saveSystem} className="settings-card">
        <div className="form-grid-2">
          <div className="form-field">
            <label>System name</label>
            <input
              type="text"
              value={system.systemName}
              onChange={(e) =>
                setSystem({ ...system, systemName: e.target.value })
              }
              required
            />
          </div>
          <div className="form-field">
            <label>Academic year</label>
            <input
              type="text"
              placeholder="e.g. 2025/2026"
              value={system.academicYear}
              onChange={(e) =>
                setSystem({ ...system, academicYear: e.target.value })
              }
            />
          </div>
        </div>

        <div className="form-grid-3">
          <div className="form-field">
            <label>Minimum GPA requirement</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="5"
              value={system.minGpa}
              onChange={(e) =>
                setSystem({ ...system, minGpa: Number(e.target.value) })
              }
            />
          </div>
          <div className="form-field">
            <label>Max documents per student</label>
            <input
              type="number"
              min="1"
              value={system.maxDocsPerStudent}
              onChange={(e) =>
                setSystem({
                  ...system,
                  maxDocsPerStudent: Number(e.target.value),
                })
              }
            />
          </div>
          <div className="form-field">
            <label>Portal status</label>
            <select
              value={system.portalStatus}
              onChange={(e) =>
                setSystem({ ...system, portalStatus: e.target.value })
              }
            >
              <option value="open">Open for submissions</option>
              <option value="closed">Closed</option>
              <option value="maintenance">Maintenance mode</option>
            </select>
          </div>
        </div>

        <div className="form-field">
          <label>Notification email</label>
          <input
            type="email"
            placeholder="alerts@yourdomain.com"
            value={system.notificationEmail}
            onChange={(e) =>
              setSystem({ ...system, notificationEmail: e.target.value })
            }
          />
        </div>

        <button className="save-btn" type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save system settings"}
        </button>
      </form>
    </section>
  );

  const renderNotificationsTab = () => (
    <section className="settings-panel">
      <h3>Notification Settings</h3>
      <p className="settings-subtitle">
        Control which email notifications are sent to admins and students.
      </p>

      <form onSubmit={saveNotifications} className="settings-card">
        <div className="checkbox-group">
          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={notifications.notifyAdminOnNewStudent}
              onChange={(e) =>
                setNotifications({
                  ...notifications,
                  notifyAdminOnNewStudent: e.target.checked,
                })
              }
            />
            <span>Notify admin when a new student registers</span>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={notifications.notifyAdminOnNewDocument}
              onChange={(e) =>
                setNotifications({
                  ...notifications,
                  notifyAdminOnNewDocument: e.target.checked,
                })
              }
            />
            <span>Notify admin when new documents are uploaded</span>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={notifications.notifyStudentOnApproval}
              onChange={(e) =>
                setNotifications({
                  ...notifications,
                  notifyStudentOnApproval: e.target.checked,
                })
              }
            />
            <span>Notify students when documents are approved/rejected</span>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={notifications.sendProfileReminder}
              onChange={(e) =>
                setNotifications({
                  ...notifications,
                  sendProfileReminder: e.target.checked,
                })
              }
            />
            <span>Send reminders to students with incomplete profiles</span>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={notifications.sendMissingDocsReminder}
              onChange={(e) =>
                setNotifications({
                  ...notifications,
                  sendMissingDocsReminder: e.target.checked,
                })
              }
            />
            <span>Send reminders if required documents are missing</span>
          </label>
        </div>

        <button className="save-btn" type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save notification settings"}
        </button>
      </form>
    </section>
  );

  const renderSecurityTab = () => (
    <section className="settings-panel">
      <h3>Security Settings</h3>
      <p className="settings-subtitle">
        Manage security policies for admin accounts and uploads.
      </p>

      <form onSubmit={saveSecurity} className="settings-card">
        <div className="checkbox-group">
          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={security.enforceStrongPassword}
              onChange={(e) =>
                setSecurity({
                  ...security,
                  enforceStrongPassword: e.target.checked,
                })
              }
            />
            <span>Enforce strong password policy</span>
          </label>

          <label className="checkbox-item">
            <input
              type="checkbox"
              checked={security.allowTwoFactorAuth}
              onChange={(e) =>
                setSecurity({
                  ...security,
                  allowTwoFactorAuth: e.target.checked,
                })
              }
            />
            <span>Allow 2FA (two-factor authentication) for admins</span>
          </label>
        </div>

        <div className="form-grid-3">
          <div className="form-field">
            <label>Session timeout (minutes)</label>
            <input
              type="number"
              min="5"
              value={security.sessionTimeoutMinutes}
              onChange={(e) =>
                setSecurity({
                  ...security,
                  sessionTimeoutMinutes: Number(e.target.value),
                })
              }
            />
          </div>
          <div className="form-field">
            <label>Max upload size (MB)</label>
            <input
              type="number"
              min="1"
              value={security.maxUploadSizeMb}
              onChange={(e) =>
                setSecurity({
                  ...security,
                  maxUploadSizeMb: Number(e.target.value),
                })
              }
            />
          </div>
          <div className="form-field">
            <label>Allowed file types</label>
            <input
              type="text"
              placeholder="pdf, jpg, png"
              value={security.allowedFileTypes}
              onChange={(e) =>
                setSecurity({
                  ...security,
                  allowedFileTypes: e.target.value,
                })
              }
            />
          </div>
        </div>

        <button className="save-btn" type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save security settings"}
        </button>
      </form>
    </section>
  );

  const renderLogsTab = () => (
    <section className="settings-panel">
      <h3>Audit Log</h3>
      <p className="settings-subtitle">
        Recent important actions performed by admins and the system.
      </p>

      <div className="settings-table-wrapper">
        <table className="settings-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>User</th>
              <th>Action</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log._id || `${log.timestamp}-${log.action}`}>
                <td>
                  {log.timestamp
                    ? new Date(log.timestamp).toLocaleString()
                    : "-"}
                </td>
                <td>{log.actorName || log.actorEmail || "System"}</td>
                <td>{log.action}</td>
                <td>{log.details || "—"}</td>
              </tr>
            ))}
            {!logs.length && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center" }}>
                  No audit logs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <div className="admin-layout-wrapper">
      <AdminSidebar />

      <main className="admin-main-content">
        <header className="settings-header">
          <div>
            <h2>⚙️ Settings</h2>
            <p className="settings-header-subtitle">
              Manage your profile, system configuration, notifications, and security.
            </p>
          </div>
        </header>

        {/* Tabs */}
        <div className="settings-tabs">
          <button
            className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            Profile
          </button>
          <button
            className={`tab-btn ${activeTab === "system" ? "active" : ""}`}
            onClick={() => setActiveTab("system")}
          >
            System
          </button>
          <button
            className={`tab-btn ${activeTab === "notifications" ? "active" : ""}`}
            onClick={() => setActiveTab("notifications")}
          >
            Notifications
          </button>
          <button
            className={`tab-btn ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            Security
          </button>
          <button
            className={`tab-btn ${activeTab === "logs" ? "active" : ""}`}
            onClick={() => setActiveTab("logs")}
          >
            Audit log
          </button>
        </div>

        {/* Global message */}
        {message && <div className="settings-message">{message}</div>}
        {loading && <p>Loading settings...</p>}

        {!loading && (
          <>
            {activeTab === "profile" && renderProfileTab()}
            {activeTab === "system" && renderSystemTab()}
            {activeTab === "notifications" && renderNotificationsTab()}
            {activeTab === "security" && renderSecurityTab()}
            {activeTab === "logs" && renderLogsTab()}
          </>
        )}
      </main>
    </div>
  );
}
