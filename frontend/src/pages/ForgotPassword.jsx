import React, { useState } from "react";
import axios from "axios";
import "../styles/Auth.css";
import { API_URL } from "../utils/config";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || "Error occurred");
    }
  };

  return (
    <div className="auth-container">
      <Link to="/" className="back-home">← Back Home</Link>
      <h2>Forgot Password</h2>

      {message && <p className="message">{message}</p>}

      <form onSubmit={handleSubmit} className="auth-form">
        <input
          type="email"
          placeholder="Enter your registered email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button type="submit">Send Reset Link</button>
      </form>

      <p className="switch-auth">
        Back to <Link to="/login">Login</Link>
      </p>
    </div>
  );
}
