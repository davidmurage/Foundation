import React from "react";
import { Link } from "react-router-dom";
import "../styles/Navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <img src="/kcb-logo.png" alt="KCB Foundation" />
      </div>
      <ul className="navbar-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/about">About Us</Link></li>
        <li>
          <Link to="/register" className="get-started">Get Started</Link>
        </li>
        <li>
          <Link to="/login">Login</Link>
        </li>
      </ul>
    </nav>
  );
}
