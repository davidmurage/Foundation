import React, { useState} from "react";
import "../../styles/student/StudentSidebar.css";

export default function StudentSidebar() {

    const [activeTab, setActiveTab] = useState("home");
    const [sidebarOpen, setSidebarOpen] = useState(false);

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
  return (
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

      
  );
}
