import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { API_URL } from "../../utils/config";
import "../../styles/admin/AdminSystemShell.css";

const badgeClass = (code) => {
  if (!code) return "badge";
  if (code >= 500) return "badge danger";
  if (code >= 400) return "badge warn";
  if (code >= 200) return "badge ok";
  return "badge";
};

export default function AdminSystemShell() {
  const token = localStorage.getItem("token");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [tab, setTab] = useState("live");

  const [overview, setOverview] = useState(null);

  const [requests, setRequests] = useState([]);
  const [reqQ, setReqQ] = useState("");
  const [reqMethod, setReqMethod] = useState("");
  const [reqStatus, setReqStatus] = useState("");
  const [reqPage, setReqPage] = useState(1);
  const [reqTotal, setReqTotal] = useState(0);
  const reqLimit = 50;

  const [events, setEvents] = useState([]);
  const [evtType, setEvtType] = useState("");
  const [evtQ, setEvtQ] = useState("");

  const [db, setDb] = useState(null);

  // live console
  const [consoleLines, setConsoleLines] = useState([]);
  const consoleRef = useRef(null);

  const pushLine = (line) => {
    setConsoleLines((prev) => {
      const next = [...prev, line].slice(-400);
      return next;
    });
  };

  // overview (header)
  const loadOverview = async () => {
    const res = await axios.get(`${API_URL}/api/admin/monitoring/overview`, { headers });
    setOverview(res.data);
  };

  const loadRequests = async (page = reqPage) => {
    const params = new URLSearchParams();
    if (reqQ) params.append("q", reqQ);
    if (reqMethod) params.append("method", reqMethod);
    if (reqStatus) params.append("status", reqStatus);
    params.append("page", String(page));
    params.append("limit", String(reqLimit));

    const res = await axios.get(`${API_URL}/api/admin/monitoring/requests?${params}`, { headers });
    setRequests(res.data.rows || []);
    setReqTotal(res.data.total || 0);
    setReqPage(res.data.page || page);
  };

  const loadEvents = async () => {
    const params = new URLSearchParams();
    if (evtType) params.append("type", evtType);
    if (evtQ) params.append("q", evtQ);
    params.append("limit", "80");

    const res = await axios.get(`${API_URL}/api/admin/monitoring/events?${params}`, { headers });
    setEvents(res.data.rows || []);
  };

  const loadDb = async () => {
    const res = await axios.get(`${API_URL}/api/admin/monitoring/db`, { headers });
    setDb(res.data);
  };

  // initial loads
  useEffect(() => {
    (async () => {
      try {
        await loadOverview();
        await loadRequests(1);
        await loadEvents();
        await loadDb();
      } catch (e) {
        console.error(e);
      }
    })();
    // eslint-disable-next-line
  }, []);

  // auto refresh overview
  useEffect(() => {
    const t = setInterval(() => loadOverview().catch(() => {}), 8000);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, [headers]);

  // live stream (SSE)
  useEffect(() => {
    const url = `${API_URL}/api/admin/monitoring/stream`;
    const es = new EventSource(url, { withCredentials: false });

    // NOTE: Authorization header isn't supported in native EventSource.
    // So we use token query param:
    // We'll provide a token-enabled stream URL below (small backend change).
    es.close();
  }, []);

  // Token-based stream (recommended): use fetch + ReadableStream
  useEffect(() => {
    let stopped = false;

    const connect = async () => {
      try {
        const streamUrl = `${API_URL}/api/admin/monitoring/stream?token=${encodeURIComponent(token)}`;
        const resp = await fetch(streamUrl);
        if (!resp.ok) return;

        const reader = resp.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (!stopped) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // parse SSE frames
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const p of parts) {
            const lines = p.split("\n");
            const evtLine = lines.find((l) => l.startsWith("event:"));
            const dataLine = lines.find((l) => l.startsWith("data:"));

            const evt = evtLine ? evtLine.replace("event:", "").trim() : "";
            const data = dataLine ? dataLine.replace("data:", "").trim() : "";

            if (evt === "live" && data) {
              const payload = JSON.parse(data);
              (payload.requests || []).forEach((r) => {
                pushLine({
                  kind: "request",
                  ts: r.createdAt,
                  text: `${r.method} ${r.path} ${r.statusCode} (${r.durationMs}ms) ${r.userRole || ""}`.trim(),
                  meta: r,
                });
              });
              (payload.events || []).forEach((e) => {
                pushLine({
                  kind: "event",
                  ts: e.createdAt,
                  text: `[${e.type}] ${e.title} — ${e.message || ""}`.trim(),
                  meta: e,
                });
              });
            }
          }
        }
      } catch (e) {
        // silent retry
      }
    };

    connect();
    return () => {
      stopped = true;
    };
  }, [token]);

  // autoscroll console
  useEffect(() => {
    if (!consoleRef.current) return;
    consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
  }, [consoleLines]);

  // export
  const exportJson = (rows, filename) => {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = (rows, filename) => {
    const headers = Object.keys(rows?.[0] || {});
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        headers.map((h) => JSON.stringify(r?.[h] ?? "")).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-page-container">
      <AdminSidebar />

      <main className="admin-page-content shell-page">
        <div className="shell-header">
          <div>
            <h2 className="shell-title">🧠 Admin System Shell</h2>
            <p className="shell-subtitle">
              Monitor API activity, system events, and database health in real-time.
            </p>
          </div>

          {overview?.health && (
            <div className="health-chips">
              <span className="chip">Uptime: {overview.health.uptimeSec}s</span>
              <span className="chip">Node: {overview.health.node}</span>
              <span className={`chip ${overview.health.mongo.state === 1 ? "ok" : "bad"}`}>
                Mongo: {overview.health.mongo.state === 1 ? "Connected" : "Disconnected"}
              </span>
              <span className="chip">
                Mem: {overview.health.memory.heapUsedMb}MB / {overview.health.memory.heapTotalMb}MB
              </span>
            </div>
          )}
        </div>

        <div className="shell-tabs">
          <button className={`tab ${tab === "live" ? "active" : ""}`} onClick={() => setTab("live")}>
            Live Console
          </button>
          <button className={`tab ${tab === "requests" ? "active" : ""}`} onClick={() => setTab("requests")}>
            Requests
          </button>
          <button className={`tab ${tab === "events" ? "active" : ""}`} onClick={() => setTab("events")}>
            Events
          </button>
          <button className={`tab ${tab === "db" ? "active" : ""}`} onClick={() => setTab("db")}>
            Database
          </button>
        </div>

        {/* LIVE */}
        {tab === "live" && (
          <section className="panel">
            <div className="panel-head">
              <h3>Live Console</h3>
              <div className="panel-actions">
                <button className="btn" onClick={() => setConsoleLines([])}>Clear</button>
                <button className="btn" onClick={() => exportJson(consoleLines, "live-console.json")}>
                  Export JSON
                </button>
              </div>
            </div>

            <div className="terminal" ref={consoleRef}>
              {consoleLines.length === 0 ? (
                <div className="terminal-empty">Waiting for activity…</div>
              ) : (
                consoleLines.map((l, idx) => (
                  <div key={idx} className={`line ${l.kind}`}>
                    <span className="ts">{new Date(l.ts).toLocaleTimeString()}</span>
                    <span className="msg">{l.text}</span>
                  </div>
                ))
              )}
            </div>

            <div className="hint">
              Tip: this streams request + event logs from the backend. If it’s empty, generate activity (login, upload, approve, etc.).
            </div>
          </section>
        )}

        {/* REQUESTS */}
        {tab === "requests" && (
          <section className="panel">
            <div className="panel-head">
              <h3>Requests</h3>
              <div className="panel-actions">
                <button className="btn" onClick={() => exportCsv(requests, "requests.csv")}>Export CSV</button>
                <button className="btn primary" onClick={() => loadRequests(1)}>Refresh</button>
              </div>
            </div>

            <div className="filters">
              <input
                className="input"
                placeholder="Search path / role / method…"
                value={reqQ}
                onChange={(e) => setReqQ(e.target.value)}
              />
              <select className="input" value={reqMethod} onChange={(e) => setReqMethod(e.target.value)}>
                <option value="">All Methods</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
              <select className="input" value={reqStatus} onChange={(e) => setReqStatus(e.target.value)}>
                <option value="">All Status</option>
                <option value="200">200</option>
                <option value="201">201</option>
                <option value="400">400</option>
                <option value="401">401</option>
                <option value="403">403</option>
                <option value="404">404</option>
                <option value="500">500</option>
              </select>
              <button className="btn primary" onClick={() => loadRequests(1)}>Apply</button>
            </div>

            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Method</th>
                    <th>Path</th>
                    <th>Status</th>
                    <th>Latency</th>
                    <th>Role</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r._id}>
                      <td>{new Date(r.createdAt).toLocaleString()}</td>
                      <td><span className="mono">{r.method}</span></td>
                      <td className="mono">{r.path}</td>
                      <td><span className={badgeClass(r.statusCode)}>{r.statusCode}</span></td>
                      <td>{r.durationMs}ms</td>
                      <td>{r.userRole || "—"}</td>
                      <td className="mono">{r.ip || "—"}</td>
                    </tr>
                  ))}
                  {!requests.length && (
                    <tr><td colSpan="7" className="center">No request logs yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pager">
              <button className="btn" disabled={reqPage <= 1} onClick={() => loadRequests(reqPage - 1)}>
                Prev
              </button>
              <span className="muted">
                Page {reqPage} • {reqTotal} total
              </span>
              <button
                className="btn"
                disabled={reqPage * reqLimit >= reqTotal}
                onClick={() => loadRequests(reqPage + 1)}
              >
                Next
              </button>
            </div>
          </section>
        )}

        {/* EVENTS */}
        {tab === "events" && (
          <section className="panel">
            <div className="panel-head">
              <h3>System Events</h3>
              <div className="panel-actions">
                <button className="btn" onClick={() => exportJson(events, "events.json")}>Export JSON</button>
                <button className="btn primary" onClick={loadEvents}>Refresh</button>
              </div>
            </div>

            <div className="filters">
              <select className="input" value={evtType} onChange={(e) => setEvtType(e.target.value)}>
                <option value="">All Types</option>
                <option value="INFO">INFO</option>
                <option value="WARN">WARN</option>
                <option value="ERROR">ERROR</option>
                <option value="SECURITY">SECURITY</option>
                <option value="AUDIT">AUDIT</option>
              </select>

              <input
                className="input"
                placeholder="Search title/message…"
                value={evtQ}
                onChange={(e) => setEvtQ(e.target.value)}
              />

              <button className="btn primary" onClick={loadEvents}>Apply</button>
            </div>

            <div className="events-list">
              {events.map((e) => (
                <div key={e._id} className={`event-card ${e.type.toLowerCase()}`}>
                  <div className="event-top">
                    <span className={`pill ${e.type.toLowerCase()}`}>{e.type}</span>
                    <span className="muted">{new Date(e.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="event-title">{e.title}</div>
                  {e.message && <div className="event-msg">{e.message}</div>}
                </div>
              ))}
              {!events.length && <div className="empty">No events yet.</div>}
            </div>
          </section>
        )}

        {/* DB */}
        {tab === "db" && (
          <section className="panel">
            <div className="panel-head">
              <h3>Database Overview</h3>
              <div className="panel-actions">
                <button className="btn primary" onClick={loadDb}>Refresh</button>
              </div>
            </div>

            {!db ? (
              <div className="empty">Loading database stats…</div>
            ) : (
              <>
                <div className="db-head">
                  <div className="chip">DB: {db.dbName}</div>
                  <div className="muted">Safe view: counts only (no raw data exposure).</div>
                </div>

                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Collection</th>
                        <th>Approx. Docs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(db.collections || []).map((c) => (
                        <tr key={c.name}>
                          <td className="mono">{c.name}</td>
                          <td>{c.approxCount ?? "—"}</td>
                        </tr>
                      ))}
                      {!db.collections?.length && (
                        <tr><td colSpan="2" className="center">No collections found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
