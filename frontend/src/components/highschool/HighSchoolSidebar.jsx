import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import "../../styles/highschool/HighSchoolSidebar.css";

export default function HighSchoolSidebar() {
  const [open, setOpen] = useState(window.innerWidth > 768);

  // Auto toggle on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setOpen(true);
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

  const closeOnMobile = () => {
    if (window.innerWidth <= 768) setOpen(false);
  };

  return (
    <>
      {/* HAMBURGER (MOBILE ONLY) */}
      <button
        className="hs-hamburger"
        onClick={() => setOpen(!open)}
      >
        ☰
      </button>

      {/* SIDEBAR */}
      <aside className={`hs-sidebar ${open ? "open" : "collapsed"}`}>
        <div className="hs-brand">🏫 High School</div>

        <nav>
          <NavLink to="/hs-dashboard/overview" end onClick={closeOnMobile}>
            🏠 Dashboard
          </NavLink>

          <NavLink to="/hs-dashboard/students" onClick={closeOnMobile}>
            👨‍🎓 Students
          </NavLink>

          {/*<NavLink to="/hs-dashboard/fees" onClick={closeOnMobile}>
            💰 Fees & Sponsorship
          </NavLink>*/}
        </nav>

        <button className="logout-btn" onClick={logout}>
          🚪 Logout
        </button>
      </aside>
    </>
  );
}
