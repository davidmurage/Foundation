import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../styles/Auth.css";
import { API_URL } from "../utils/config";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, form);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);

      setMessage("Login successful!");

      if (res.data.role === "admin") {
        window.location.href = "/admin-dashboard";
      } else {
        window.location.href = res.data.profileIncomplete
          ? "/profile-setup"
          : "/student-dashboard";
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Invalid credentials");
    }
  };

  return (
    <div className="auth-container">
      <Link to="/" className="back-home">← Back Home</Link>

      <h2>Sign In</h2>
      {message && <p className="message">{message}</p>}

      <form onSubmit={handleSubmit} className="auth-form">
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <button type="submit">Login</button>
      </form>

      <p className="forgot-pass">
        <Link to="/forgot-password">Forgot Password?</Link>
      </p>

      <p className="switch-auth">
        Don't have an account? <Link to="/register">Sign Up</Link>
      </p>
    </div>
  );
}
