import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import "../../styles/admin/AdminSidebar.css";

export default function AdminSidebar() {
  const [open, setOpen] = useState(window.innerWidth > 992);

  // Auto-collapse when screen becomes small
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 992) setOpen(true);
      else setOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/login";
  };

  const handleLinkClick = () => {
    if (window.innerWidth <= 992) setOpen(false);
  };

  return (
    <>
      {/* HAMBURGER BUTTON — MOBILE ONLY */}
      <button
        className="admin-hamburger"
        onClick={() => setOpen(!open)}
      >
        ☰
      </button>

      {/* SIDEBAR */}
      <aside className={`admin-sidebar ${open ? "open" : "collapsed"}`}>
        <div className="brand">KCB Admin</div>

        <nav>
          <NavLink to="/admin-dashboard/overview" onClick={handleLinkClick} end>
            🏠 Overview
          </NavLink>

          <NavLink to="/admin-dashboard/students" onClick={handleLinkClick}>
            👥 Students
          </NavLink>

          <NavLink to="/admin-dashboard/admin-users" onClick={handleLinkClick}>
            🛡 Admin Users
          </NavLink>

          <NavLink to="/admin-dashboard/institutions" onClick={handleLinkClick}>
            🏫 Institutions
          </NavLink>

          <NavLink to="/admin/documents" onClick={handleLinkClick}>
            📄 Documents
          </NavLink>

          <NavLink to="/admin/performance" onClick={handleLinkClick}>
            📊 Performance
          </NavLink>

          <NavLink to="/admin/settings" onClick={handleLinkClick}>
            ⚙️ Settings
          </NavLink>
        </nav>

        <button className="logout-btn" onClick={logout}>
          🚪 Logout
        </button>
      </aside>
    </>
  );
}
