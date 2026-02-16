import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../utils/config";
import "../styles/ChatWidget.css";

export default function ChatWidget() {
  const token = localStorage.getItem("token");

  const [open, setOpen] = useState(false);
  const [threads, setThreads] = useState([]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (open) loadThreads();
  }, [open]);

  const loadThreads = async () => {
    const res = await axios.get(`${API_URL}/api/feedback/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setThreads(res.data);
    if (res.data.length > 0) setSelected(res.data[0]);
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    if (!selected) {
      const res = await axios.post(
        `${API_URL}/api/feedback`,
        { message, page: window.location.pathname },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelected(res.data);
    } else {
      const res = await axios.post(
        `${API_URL}/api/feedback/${selected._id}/message`,
        { message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelected(res.data);
    }

    setMessage("");
    loadThreads();
  };

  return (
    <>
      <div className="chat-floating" onClick={() => setOpen(!open)}>
        💬
      </div>

      {open && (
        <div className="chat-panel">
          <h4>Support Chat</h4>

          <div className="chat-messages">
            {selected?.messages.map((m, i) => (
              <div
                key={i}
                className={`chat-bubble ${m.sender}`}
              >
                {m.text}
              </div>
            ))}
          </div>

          <div className="chat-input">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type message..."
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </>
  );
}
