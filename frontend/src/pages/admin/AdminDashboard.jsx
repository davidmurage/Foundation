import React, { useState, useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import "../../styles/Admin.css";

export default function AdminLayout() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (window.innerWidth > 992) setOpen(true);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/login";
  };

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className={`admin-sidebar ${open ? "open" : "collapsed"}`}>
        <div className="brand">KCB Admin</div>

        <nav>
          <NavLink to="/admin-dashboard/overview" end>🏠 Overview</NavLink>
          <NavLink to="/admin-dashboard/students">👥 Students</NavLink>
          <NavLink to="/admin-dashboard/admin-users">🛡 Admin Users</NavLink>
          <NavLink to="/admin/institutions">🏫 Institutions</NavLink>
          <NavLink to="/admin/documents">📄 Documents</NavLink>
          <NavLink to="/admin/performance">📊 Performance</NavLink>
          <NavLink to="/admin/settings">⚙️ Settings</NavLink>
        </nav>

        <button className="logout-btn" onClick={logout}>
          🚪 Logout
        </button>
      </aside>

      {/* HAMBURGER FOR MOBILE */}
      <button className="admin-hamburger" onClick={() => setOpen(!open)}>
        ☰
      </button>

      {/* MAIN CONTENT */}
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
