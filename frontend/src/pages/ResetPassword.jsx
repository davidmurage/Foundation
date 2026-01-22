import React, { useState } from "react";
import axios from "axios";
import { API_URL } from "../utils/config";
import { useParams, Link } from "react-router-dom";
import "../styles/Auth.css";

export default function ResetPassword() {
  const [form, setForm] = useState({
    email: "",
    otp: "",
    password: "",
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${API_URL}/api/auth/reset-password`,
        form
      );
      setMessage(res.data.message);

      //redirect to login after success
      window.location.href = "/login";
    } catch (err) {
      setMessage(err.response?.data?.message || "Reset failed");
    }
  };

  return (
    <div className="auth-container">
      <h2>Reset Password</h2>
      {message && <p className="message">{message}</p>}

      <form className="auth-form" onSubmit={handleSubmit}>
        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          name="otp"
          placeholder="OTP Code"
          value={form.otp}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="New Password"
          value={form.password}
          onChange={handleChange}
          required
        />

        <button type="submit">Reset Password</button>
      </form>

      <p className="switch-auth">
        Back to <Link to="/login">Login</Link>
      </p>
    </div>
  );
}
