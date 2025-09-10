import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Navbar.css";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <img src="/kcb-logo.png" alt="KCB Foundation" />
      </div>

      {/* Hamburger Button */}
      <div
        className={`hamburger ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
      </div>

      {/* Nav Links */}
      <ul className={`navbar-links ${isOpen ? "active" : ""}`}>
        <li><Link to="/" onClick={() => setIsOpen(false)}>Home</Link></li>
        <li><Link to="/about" onClick={() => setIsOpen(false)}>About Us</Link></li>
        <li>
          <Link to="/register" className="get-started" onClick={() => setIsOpen(false)}>Get Started</Link>
        </li>
        {/*<li><Link to="/login" onClick={() => setIsOpen(false)}>Login</Link></li>*/}
      </ul>
    </nav>
  );
}
