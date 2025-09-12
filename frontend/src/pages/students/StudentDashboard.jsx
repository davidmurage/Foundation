import React, { useState } from "react";
import ProfileView from "./ProfileView";
import ProfileEdit from "./ProfileEdit";
import "../../styles/StudentDashboard.css";

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/login";
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : "collapsed"}`}>
        <h2>KCB Portal</h2>
        <ul>
          <li
            className={activeTab === "home" ? "active" : ""}
            onClick={() => setActiveTab("home")}
          >
            🏠 Dashboard
          </li>
          <li
            className={activeTab === "profile" ? "active" : ""}
            onClick={() => setActiveTab("profile")}
          >
            👤 My Profile
          </li>
          <li
            className={activeTab === "documents" ? "active" : ""}
            onClick={() => setActiveTab("documents")}
          >
            📄 Documents
          </li>
          <li
            className={activeTab === "performance" ? "active" : ""}
            onClick={() => setActiveTab("performance")}
          >
            📊 Performance
          </li>
          <li onClick={handleLogout} className="logout">
            🚪 Logout
          </li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="dashboard-content">
        {/* Hamburger for mobile */}
        <button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          ☰
        </button>

        {activeTab === "home" && (
          <>
            <h2>🎓 Student Dashboard</h2>
            <p>Welcome! Use the sidebar to navigate your tasks.</p>
          </>
        )}

        {activeTab === "profile" && <ProfileView setActiveTab={setActiveTab} />}
        {activeTab === "profile-edit" && <ProfileEdit setActiveTab={setActiveTab} />}
      </main>
    </div>
  );
}
