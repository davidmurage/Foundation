import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../utils/config";
import AdminSidebar from "../../components/admin/AdminSidebar";
import "../../styles/admin/AdminFeedBack.css";

export default function AdminFeedback() {
  const token = localStorage.getItem("token");

  const [threads, setThreads] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState("");

  useEffect(() => {
    loadThreads();
  }, []);

  const loadThreads = async () => {
    const res = await axios.get(`${API_URL}/api/feedback`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setThreads(res.data);
  };

  const sendReply = async () => {
    if (!reply.trim()) return;

    const res = await axios.post(
      `${API_URL}/api/feedback/${selected._id}/reply`,
      { message: reply },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setSelected(res.data);
    setReply("");
    loadThreads();
  };

  return (
    <div className="admin-page-container">
      <AdminSidebar />

      <main className="admin-page-content feedback-page">
        <h2>User Support Center</h2>

        <div className="feedback-layout">
          <div className="feedback-list">
            {threads.map((t) => (
              <div
                key={t._id}
                className={`feedback-item ${selected?._id === t._id ? "active" : ""}`}
                onClick={() => setSelected(t)}
              >
                <strong>{t.user?.fullName}</strong>
                <p>{t.status.toUpperCase()}</p>
              </div>
            ))}
          </div>

          <div className="feedback-chat">
            {selected && (
              <>
                <div className="chat-history">
                  {selected.messages.map((m, i) => (
                    <div key={i} className={`chat-bubble ${m.sender}`}>
                      {m.text}
                    </div>
                  ))}
                </div>

                <div className="chat-reply">
                  <input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type reply..."
                  />
                  <button onClick={sendReply}>Send</button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
