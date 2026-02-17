import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_URL } from "../utils/config";
import { socket } from "../utils/socket";
import "../styles/ChatWidget.css";

export default function ChatWidget() {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId"); // ensure you store this at login
  const role = localStorage.getItem("role");

  const [open, setOpen] = useState(false);
  const [threads, setThreads] = useState([]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);

  const selectedMessages = useMemo(() => selected?.messages || [], [selected]);

  useEffect(() => {
    if (!open) return;

    loadThreads();

    // connect socket
    socket.connect();
    socket.emit("join", { userId, role });

    // when admin replies, refresh threads + select same
    socket.on("feedback:reply", (updatedThread) => {
      setThreads((prev) => {
        const copy = [...prev];
        const idx = copy.findIndex((t) => t._id === updatedThread._id);
        if (idx >= 0) copy[idx] = updatedThread;
        else copy.unshift(updatedThread);
        return copy;
      });

      if (selected?._id === updatedThread._id) setSelected(updatedThread);
    });

    return () => {
      socket.off("feedback:reply");
      socket.disconnect();
    };
    // eslint-disable-next-line
  }, [open]);

  const loadThreads = async () => {
    const res = await axios.get(`${API_URL}/api/feedback/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setThreads(res.data || []);
    if (!selected && res.data?.length) setSelected(res.data[0]);
  };

  const createOrSend = async () => {
    if (!message.trim() && !file) return;

    const fd = new FormData();
    fd.append("message", message);
    fd.append("page", window.location.pathname);
    if (file) fd.append("file", file);

    try {
      let res;

      if (!selected) {
        res = await axios.post(`${API_URL}/api/feedback`, fd, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSelected(res.data);
      } else {
        res = await axios.post(`${API_URL}/api/feedback/${selected._id}/message`, fd, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSelected(res.data);
      }

      setMessage("");
      setFile(null);
      loadThreads();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to send");
    }
  };

  return (
    <>
      <button className="chat-floating" onClick={() => setOpen((v) => !v)}>
        💬
      </button>

      {open && (
        <div className="chat-panel">
          <div className="chat-head">
            <h4>Chat With Us</h4>
            <button className="chat-close" onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="chat-body">
            <div className="chat-threadbar">
              <div className="chat-thread-title">Your Tickets</div>

              {threads.length === 0 && (
                <div className="chat-thread-empty">No chats yet</div>
              )}

              {threads.map((t) => (
                <div
                  key={t._id}
                  className={`chat-thread ${selected?._id === t._id ? "active" : ""}`}
                  onClick={() => setSelected(t)}
                >
                  <div className="chat-thread-row">
                    <span className={`status-pill ${t.status}`}>{t.status}</span>
                    <span className="chat-thread-time">
                      {new Date(t.updatedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="chat-thread-page">{t.page}</div>
                </div>
              ))}
            </div>

            <div className="chat-messages">
              {!selected && (
                <div className="chat-empty">
                  Start a conversation by sending a message 👇
                </div>
              )}

              {selected && selectedMessages.map((m, i) => (
                <div key={i} className={`chat-bubble ${m.sender}`}>
                  {m.text && <div className="chat-text">{m.text}</div>}

                  {!!m.attachments?.length && (
                    <div className="chat-files">
                      {m.attachments.map((a, idx) => (
                        <a
                          key={idx}
                          className="chat-file"
                          href={`${API_URL}${a.url}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          📎 {a.originalName || "Attachment"}
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="chat-meta">
                    {new Date(m.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="chat-input">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue…"
            />
            <label className="chat-attach">
              📎
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                hidden
              />
            </label>
            <button onClick={createOrSend}>Send</button>
          </div>

          {file && <div className="chat-file-selected">Selected: {file.name}</div>}
        </div>
      )}
    </>
  );
}
