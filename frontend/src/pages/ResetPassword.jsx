import React, { useState } from "react";
import axios from "axios";
import { API_URL } from "../utils/config";
import { useParams, Link } from "react-router-dom";
import "../styles/Auth.css";

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        `${API_URL}/api/auth/reset-password/${token}`,
        { password }
      );
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || "Error resetting password");
    }
  };

  return (
    <div className="auth-container">
      <Link to="/" className="back-home">← Back Home</Link>
      <h2>Reset Password</h2>
      {message && <p className="message">{message}</p>}

      <form className="auth-form" onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Enter new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
