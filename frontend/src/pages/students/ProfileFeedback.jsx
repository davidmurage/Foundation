import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../utils/config";

export default function ProfileFeedback() {
  const token = localStorage.getItem("token");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const load = async () => {
      const res = await axios.get(`${API_URL}/api/student/rejections`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);
    };
    load();
  }, []);

  return (
    <div className="feedback-page">
      <h2>Profile Review Feedback</h2>

      {messages.length === 0 ? (
        <p>No rejection messages yet.</p>
      ) : (
        messages.map((m) => (
          <div key={m._id} className="feedback-card">
            <h4>Rejected on {new Date(m.date).toLocaleDateString()}</h4>
            <p>{m.message}</p>
          </div>
        ))
      )}
    </div>
  );
}
