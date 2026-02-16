import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_URL } from "../../utils/config";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { socket } from "../../utils/socket";
import "../../styles/admin/AdminFeedback.css";

export default function AdminFeedback() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const [threads, setThreads] = useState([]);
  const [selected, setSelected] = useState(null);

  const [reply, setReply] = useState("");
  const [file, setFile] = useState(null);
  const [resolve, setResolve] = useState(true);

  const selectedMessages = useMemo(() => selected?.messages || [], [selected]);

  useEffect(() => {
    loadThreads();

    socket.connect();
    socket.emit("join", { role });

    socket.on("feedback:new", (t) => {
      setThreads((prev) => [t, ...prev]);
    });

    socket.on("feedback:update", (t) => {
      setThreads((prev) => {
        const copy = [...prev];
        const idx = copy.findIndex((x) => x._id === t._id);
        if (idx >= 0) copy[idx] = t;
        else copy.unshift(t);
        return copy.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      });

      if (selected?._id === t._id) setSelected(t);
    });

    return () => {
      socket.off("feedback:new");
      socket.off("feedback:update");
      socket.disconnect();
    };
    // eslint-disable-next-line
  }, [selected?._id]);

  const loadThreads = async () => {
    const res = await axios.get(`${API_URL}/api/feedback`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setThreads(res.data || []);
    if (!selected && res.data?.length) setSelected(res.data[0]);
  };

  const sendReply = async () => {
    if (!selected) return;
    if (!reply.trim() && !file) return;

    const fd = new FormData();
    fd.append("message", reply);
    fd.append("resolve", String(resolve));
    if (file) fd.append("file", file);

    const res = await axios.post(`${API_URL}/api/feedback/${selected._id}/reply`, fd, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setSelected(res.data);
    setReply("");
    setFile(null);
    loadThreads();
  };

  const suggestReply = async () => {
    if (!selected) return;

    const res = await axios.post(
      `${API_URL}/api/feedback/${selected._id}/suggest-reply`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setReply(res.data.suggestion || "");
  };

  return (
    <div className="admin-page-container">
      <AdminSidebar />

      <main className="admin-page-content feedback-page">
        <div className="feedback-header">
          <h2>📩 Support Inbox</h2>
          <a className="feedback-analytics-link" href="/admin-dashboard/feedback-analytics">
            View Analytics →
          </a>
        </div>

        <div className="feedback-layout">
          {/* LEFT */}
          <div className="feedback-list">
            {threads.map((t) => (
              <div
                key={t._id}
                className={`feedback-item ${selected?._id === t._id ? "active" : ""}`}
                onClick={() => setSelected(t)}
              >
                <div className="row">
                  <strong>{t.user?.fullName || "Unknown"}</strong>
                  <span className={`pill ${t.status}`}>{t.status}</span>
                </div>
                <div className="meta">
                  <span>{t.page}</span>
                  <span>{new Date(t.updatedAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>

          {/* RIGHT */}
          <div className="feedback-chat">
            {!selected && <div className="empty">Select a thread</div>}

            {selected && (
              <>
                <div className="chat-top">
                  <div>
                    <div className="title">
                      {selected.user?.fullName} • {selected.user?.email}
                    </div>
                    <div className="sub">
                      Page: <b>{selected.page}</b> • Status:{" "}
                      <b className={selected.status}>{selected.status}</b>
                    </div>
                  </div>
                </div>

                <div className="chat-history">
                  {selectedMessages.map((m, i) => (
                    <div key={i} className={`bubble ${m.sender}`}>
                      {m.text && <div className="text">{m.text}</div>}

                      {!!m.attachments?.length && (
                        <div className="files">
                          {m.attachments.map((a, idx) => (
                            <a
                              key={idx}
                              className="file"
                              href={`${API_URL}${a.url}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              📎 {a.originalName || "Attachment"}
                            </a>
                          ))}
                        </div>
                      )}

                      <div className="time">{new Date(m.createdAt).toLocaleString()}</div>
                    </div>
                  ))}
                </div>

                <div className="chat-tools">
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={resolve}
                      onChange={(e) => setResolve(e.target.checked)}
                    />
                    Mark as resolved
                  </label>

                  <button className="btn ghost" onClick={suggestReply}>
                    🧠 Suggest Reply
                  </button>
                </div>

                <div className="chat-reply">
                  <input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type reply…"
                  />

                  <label className="attach">
                    📎
                    <input
                      type="file"
                      hidden
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </label>

                  <button className="btn primary" onClick={sendReply}>
                    Send
                  </button>
                </div>

                {file && <div className="file-selected">Selected: {file.name}</div>}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
