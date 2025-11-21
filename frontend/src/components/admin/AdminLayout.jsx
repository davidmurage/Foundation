import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import "../../styles/Admin.css";

export default function AdminLayout() {
  const [open, setOpen] = useState(window.innerWidth > 992);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/login";
  };

  const handleLinkClick = () => {
    if (window.innerWidth <= 992) setOpen(false);
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <AdminSidebar
        open={open}
        handleLinkClick={handleLinkClick}
        logout={logout}
      />

      {/* Hamburger */}
      <button className="admin-hamburger" onClick={() => setOpen(!open)}>
        ☰
      </button>

      {/* Content Wrapper */}
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
