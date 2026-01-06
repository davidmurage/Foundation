import { NavLink } from "react-router-dom";
import "../../styles/highschool/HighSchoolSidebar.css";

export default function HighSchoolSidebar() {
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/login";
  };

  return (
    <aside className="hs-sidebar">
      <div className="hs-brand">🏫 High School</div>

      <nav>
        <NavLink to="/hs-dashboard/overview" end>
          🏠 Dashboard
        </NavLink>

        <NavLink to="/hs-dashboard/students">
          👨‍🎓 Students
        </NavLink>

        <NavLink to="/hs-dashboard/fees">
          💰 Fees & Sponsorship
        </NavLink>
      </nav>

      <button className="logout-btn" onClick={logout}>
        🚪 Logout
      </button>
    </aside>
  );
}
