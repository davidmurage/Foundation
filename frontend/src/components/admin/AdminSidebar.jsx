import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import "../../styles/admin/AdminSidebar.css";
import NotificationBell from "./NotificationBell";

export default function AdminSidebar() {
  const [open, setOpen] = useState(window.innerWidth > 992);

  /* ================= AUTO COLLAPSE ================= */
  useEffect(() => {
    const handleResize = () => {
      setOpen(window.innerWidth > 992);
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
      {/* HAMBURGER — MOBILE */}
      <button className="admin-hamburger" onClick={() => setOpen(!open)}>
        ☰
      </button>

      {/* SIDEBAR */}
      <aside className={`admin-sidebar ${open ? "open" : "collapsed"}`}>
        <div className="brand">KCB Admin</div>

        <NotificationBell />

        <nav>
          {/* ================= CAMPUS / TVET ================= */}
          <div className="sidebar-section-title">🎓 Campus & TVET</div>

          <NavLink to="/admin-dashboard/overview" onClick={handleLinkClick} end>
            🏠 Overview
          </NavLink>

          <NavLink to="/admin-dashboard/students" onClick={handleLinkClick}>
            👥 Students
          </NavLink>

          <NavLink to="/admin-dashboard/institutions" onClick={handleLinkClick}>
            🏫 Institutions
          </NavLink>

          <NavLink to="/admin-dashboard/admin-users" onClick={handleLinkClick}>
            🛡 Admin Users
          </NavLink>

          {/* ================= DIVIDER ================= */}
          <div className="sidebar-divider" />

          {/* ================= HIGH SCHOOL ================= */}
          <div className="sidebar-section-title">🏫 High Schools</div>

          <NavLink
            to="/admin-dashboard/highschools"
            onClick={handleLinkClick}
          >
            🏫 High Schools
          </NavLink>

          <NavLink
            to="/admin-dashboard/highschool-admins"
            onClick={handleLinkClick}
          >
            👔 School Admins
          </NavLink>
          
          {/*========== REPORTS & ANALYSIS ========*/}
          <div className="sidebar-divider" />
          <NavLink to="/admin-dashboard/reports/institutions">📊 Reports</NavLink>

          {/*=======FeedBack=========*/}
           <div className="sidebar-divider" />
           <NavLink to="/admin-dashboard/feedback">💬 FeedBack</NavLink>

          {/* ================= SETTINGS ================= */}
          <div className="sidebar-divider" />

          <NavLink to="/admin-dashboard/shell" onClick={handleLinkClick}>🖥️AdminShell</NavLink>

          <NavLink to="/admin-dashboard/settings" onClick={handleLinkClick}>
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
