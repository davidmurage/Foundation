// src/pages/student/StudentDashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

import ProfileView from "./ProfileView";
import ProfileEdit from "./ProfileEdit";
import Documents from "./Documents";
import Performance from "./Performance";

import { API_URL } from "../../utils/config";
import "../../styles/student/StudentDashboard.css";

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Home/dashboard data
  const [homeLoading, setHomeLoading] = useState(false);
  const [homeError, setHomeError] = useState("");

  const [profileStatus, setProfileStatus] = useState({
    status: "incomplete",
    message: "Please complete your profile.",
    rejectionReason: null,
  });

  const [docSummary, setDocSummary] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    missing: 0,
  });

  const [performanceSnap, setPerformanceSnap] = useState({
    gpa: null,
    trend: "none", // "up" | "down" | "flat" | "none"
  });

  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);

  const token = localStorage.getItem("token");

  // ---------- LOGOUT ----------
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/login";
  };

  // Close sidebar after clicking a menu item (for mobile)
  const handleMenuClick = (tab) => {
    setActiveTab(tab);
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  // ---------- LOAD HOME DATA ----------
  const fetchHomeData = async () => {
    if (!token) return;
    setHomeLoading(true);
    setHomeError("");

    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [statusRes, docRes, perfRes, notifRes] = await Promise.all([
        axios.get(`${API_URL}/api/student/status`, { headers }),
        axios.get(`${API_URL}/api/student/doc-summary`, { headers }),
        axios.get(`${API_URL}/api/student/performance-snap`, { headers }),
        axios.get(`${API_URL}/api/student/notifications`, { headers }),
      ]);

      if (statusRes.data) setProfileStatus(statusRes.data);
      if (docRes.data) setDocSummary(docRes.data);
      if (perfRes.data) setPerformanceSnap(perfRes.data);
      if (Array.isArray(notifRes.data)) setNotifications(notifRes.data);
    } catch (err) {
      console.error("DASHBOARD HOME ERROR:", err);
      setHomeError(
        err.response?.data?.message ||
          "Failed to load dashboard overview. Try again later."
      );
    } finally {
      setHomeLoading(false);
    }
  };

  // Load whenever user is on the home tab
  useEffect(() => {
    if (activeTab === "home") {
      fetchHomeData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ---------- HELPERS ----------
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const renderTrendLabel = () => {
    const { gpa, trend } = performanceSnap;
    if (gpa == null) return "No GPA data yet";

    if (trend === "up") return `GPA improving 📈`;
    if (trend === "down") return `GPA dropping 📉`;
    if (trend === "flat") return `GPA stable ➖`;
    return "Recent GPA snapshot";
  };

  const profileStatusBadgeClass =
    profileStatus.status === "approved"
      ? "status-badge approved"
      : profileStatus.status === "rejected"
      ? "status-badge rejected"
      : "status-badge pending";

  // ---------- MAIN UI ----------
  return (
    <div className="dashboard-layout">
      Sidebar
      <aside className={`sidebar ${sidebarOpen ? "open" : "collapsed"}`}>
        <h2>KCB Portal</h2>
        <ul>
          <li
            className={activeTab === "home" ? "active" : ""}
            onClick={() => handleMenuClick("home")}
          >
            🏠 Dashboard
          </li>
          <li
            className={activeTab === "profile" ? "active" : ""}
            onClick={() => handleMenuClick("profile")}
          >
            👤 My Profile
          </li>
          <li
            className={activeTab === "documents" ? "active" : ""}
            onClick={() => handleMenuClick("documents")}
          >
            📄 Documents
          </li>
          <li
            className={activeTab === "performance" ? "active" : ""}
            onClick={() => handleMenuClick("performance")}
          >
            📊 Performance
          </li>
          <li onClick={handleLogout} className="logout">
            🚪 Logout
          </li>
        </ul>
      </aside>

      {/* Hamburger for mobile */}
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        ☰
      </button>

      {/* Main Content */}
      <main className="dashboard-content">
        {/* Top bar with notifications */}
        <div className="dashboard-topbar">
          <div>
            <h2>🎓 Student Dashboard</h2>
            <p className="topbar-subtitle">
              Track your profile status, documents, and academic performance in
              real time.
            </p>
          </div>

          <div className="topbar-right">
            <div className="notif-wrapper">
              <button
                type="button"
                className="notif-bell"
                onClick={() => setNotifOpen((prev) => !prev)}
              >
                🔔
                {unreadCount > 0 && (
                  <span className="notif-count">{unreadCount}</span>
                )}
              </button>

              {notifOpen && (
                <div className="notif-dropdown">
                  <h4>Notifications</h4>
                  {notifications.length === 0 && (
                    <p className="notif-empty">No notifications yet.</p>
                  )}
                  <ul>
                    {notifications.slice(0, 8).map((n) => (
                      <li key={n._id || n.createdAt}>
                        <div className="notif-title">{n.title}</div>
                        <div className="notif-time">
                          {n.createdAt
                            ? new Date(n.createdAt).toLocaleString()
                            : ""}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TABS CONTENT */}
        {activeTab === "home" && (
          <section className="home-section">
            {homeLoading && <p>Loading overview...</p>}
            {homeError && <p className="error-msg">{homeError}</p>}

            {/* Summary cards */}
            {!homeLoading && (
              <>
                <div className="home-cards-grid">
                  {/* Profile status */}
                  <div className="home-card">
                    <div className="home-card-header">
                      <span className="card-icon">👤</span>
                      <span className="card-title">Profile Status</span>
                    </div>
                    <div className="home-card-main">
                      <span className={profileStatusBadgeClass}>
                        {profileStatus.status === "approved" && "Approved"}
                        {profileStatus.status === "rejected" && "Rejected"}
                        {profileStatus.status === "pending" && "Pending review"}
                        {profileStatus.status === "incomplete" &&
                          "Incomplete profile"}
                      </span>
                    </div>
                    <p className="home-card-text">{profileStatus.message}</p>

                    {profileStatus.status === "rejected" &&
                      profileStatus.rejectionReason && (
                        <div className="home-card-note">
                          <strong>Reason:</strong>{" "}
                          {profileStatus.rejectionReason}
                        </div>
                      )}

                    <button
                      className="home-card-btn"
                      onClick={() => setActiveTab("profile")}
                    >
                      View / Edit Profile
                    </button>
                  </div>

                  {/* Documents status */}
                  <div className="home-card">
                    <div className="home-card-header">
                      <span className="card-icon">📄</span>
                      <span className="card-title">Documents</span>
                    </div>
                    <div className="home-card-main">
                      <span className="home-card-number">
                        {docSummary.total}
                      </span>
                      <span className="home-card-label">Total uploaded</span>
                    </div>

                    <div className="home-card-doc-grid">
                      <div>
                        <span className="pill pill-approved">
                          {docSummary.approved} approved
                        </span>
                      </div>
                      <div>
                        <span className="pill pill-pending">
                          {docSummary.pending} pending
                        </span>
                      </div>
                      <div>
                        <span className="pill pill-rejected">
                          {docSummary.rejected} rejected
                        </span>
                      </div>
                      {docSummary.missing > 0 && (
                        <div>
                          <span className="pill pill-missing">
                            {docSummary.missing} missing
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      className="home-card-btn"
                      onClick={() => setActiveTab("documents")}
                    >
                      Manage Documents
                    </button>
                  </div>

                  {/* Performance snapshot */}
                  <div className="home-card">
                    <div className="home-card-header">
                      <span className="card-icon">📊</span>
                      <span className="card-title">Performance</span>
                    </div>
                    <div className="home-card-main">
                      <span className="home-card-number">
                        {performanceSnap.gpa != null
                          ? performanceSnap.gpa.toFixed(2)
                          : "—"}
                      </span>
                      <span className="home-card-label">Latest GPA</span>
                    </div>

                    <p className="home-card-text">{renderTrendLabel()}</p>

                    <button
                      className="home-card-btn"
                      onClick={() => setActiveTab("performance")}
                    >
                      View Full Performance
                    </button>
                  </div>
                </div>

                {/* Quick actions + info panel */}
                <div className="home-bottom-row">
                  <div className="quick-actions-card">
                    <h3>Quick Actions</h3>
                    <div className="quick-actions-grid">
                      <button
                        onClick={() => setActiveTab("profile")}
                        className="qa-btn"
                      >
                        ✏️ Update Profile
                      </button>
                      <button
                        onClick={() => setActiveTab("documents")}
                        className="qa-btn"
                      >
                        ⬆️ Upload Documents
                      </button>
                      <button
                        onClick={() => setActiveTab("performance")}
                        className="qa-btn"
                      >
                        📈 Check Performance
                      </button>
                    </div>
                    <p className="qa-note">
                      Keeping your profile and documents up to date helps the
                      KCB Foundation team review your sponsorship faster.
                    </p>
                  </div>

                  <div className="info-card">
                    <h3>Tips for a complete application</h3>
                    <ul>
                      <li>Ensure your personal and contact details are accurate</li>
                      <li>Upload clear copies of your transcripts and ID</li>
                      <li>Check your email regularly for feedback or updates</li>
                      <li>Monitor your GPA and aim to improve each semester</li>
                    </ul>
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {activeTab === "profile" && (
          <ProfileView setActiveTab={setActiveTab} />
        )}
        {activeTab === "profile-edit" && (
          <ProfileEdit setActiveTab={setActiveTab} />
        )}
        {activeTab === "documents" && <Documents />}
        {activeTab === "performance" && <Performance />}
      </main>
    </div>
  );
}
