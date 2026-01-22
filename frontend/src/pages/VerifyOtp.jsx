import React, { useState } from "react";
import axios from "axios";
import { API_URL } from "../utils/config";

export default function VerifyOtp() {
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      const userId = localStorage.getItem("otpUserId");

      const res = await axios.post(`${API_URL}/api/auth/verify-otp`, {
        userId,
        otp,
      });

      localStorage.removeItem("otpUserId");
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);

      if (res.data.role === "admin") {
        window.location.href = "/admin-dashboard/overview";
      } else if (res.data.role === "highschool_admin") {
        window.location.href = "/hs-dashboard/overview";
      } else {
        window.location.href = "/student-dashboard";
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "OTP verification failed");
    }
  };

  return (
    <div className="auth-container">
      <h2>Email Verification</h2>
      {message && <p className="message">{message}</p>}

      <form onSubmit={submit} className="auth-form">
        <input
          type="text"
          placeholder="Enter OTP code"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        />
        <button type="submit">Verify</button>
      </form>
    </div>
  );
}
