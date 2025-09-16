import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import "../../styles/Admin.css";

export default function AdminLayout() {
  const [open, setOpen] = useState(true);
  const location = useLocation();

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
      <aside className={`admin-sidebar ${open ? "open" : "collapsed"}`}>
        <div className="brand">KCB Admin</div>
        <nav>
          {/* Link to list, not to a param */}
          <NavLink
            to="/admin-dashboard/students"
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            👥 Students
          </NavLink>
        </nav>
        <button className="logout-btn" onClick={logout}>
          🚪 Logout
        </button>
      </aside>

      <button className="admin-hamburger" onClick={() => setOpen(!open)}>
        ☰
      </button>

      <main className="admin-content">
        <Outlet key={location.pathname} />
      </main>
    </div>
  );
}
