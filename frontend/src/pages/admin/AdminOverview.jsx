// src/pages/admin/AdminOverview.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/AdminOverview.css";
import { API_URL } from "../../utils/config";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [latestDocs, setLatestDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchData = async () => {
      try {
        const [statsRes, docsRes] = await Promise.all([
          axios.get(`${API_URL}/api/admin/stats`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/api/admin/latest-documents`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setStats(statsRes.data || {});
        setLatestDocs(docsRes.data || []);
      } catch (err) {
        console.error("ADMIN OVERVIEW ERROR:", err);
        setError(
          err.response?.data?.message || "Failed to load dashboard data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Prepare chart data safely
  const institutionData =
    stats?.studentsByInstitution?.map((item) => ({
      institution: item._id || "Unknown",
      count: Number(item.count) || 0,
    })) || [];

  const docsTypeData =
    stats?.docsByType?.map((item) => ({
      type: item._id || "Unknown",
      count: Number(item.count) || 0,
    })) || [];

  const gpaYearData =
    stats?.gpaByYear?.map((item) => ({
      year: String(item._id ?? ""),
      avgGpa: Number(item.avgGpa || 0),
    })) || [];

  if (loading) {
    return (
      <div className="admin-overview-container">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-overview-container">
        <p className="error-msg">{error}</p>
      </div>
    );
  }

  return (
    <div className={`admin-overview-container ${dark ? "dark" : ""}`}>
      {/* Header with dark mode toggle */}
      <div className="overview-header">
        <h2>Dashboard Overview</h2>
        <div className="theme-toggle">
          <span>{dark ? "🌙 Dark Mode" : "☀️ Light Mode"}</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={dark}
              onChange={() => setDark((prev) => !prev)}
            />
            <span className="slider round"></span>
          </label>
        </div>
      </div>

      {/* Stats cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon">👥</span>
            <span className="stat-title">Total Students</span>
          </div>
          <div className="stat-value">{stats?.totalStudents || 0}</div>
          <div className="stat-subtext">Registered as sponsored students</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon">📘</span>
            <span className="stat-title">Profiles Completed</span>
          </div>
          <div className="stat-value">{stats?.profiledStudents || 0}</div>
          <div className="stat-subtext">Students with full profile setup</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon">📄</span>
            <span className="stat-title">Documents Uploaded</span>
          </div>
          <div className="stat-value">{stats?.totalDocuments || 0}</div>
          <div className="stat-subtext">All student uploads</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon">🧾</span>
            <span className="stat-title">Transcripts</span>
          </div>
          <div className="stat-value">{stats?.totalTranscripts || 0}</div>
          <div className="stat-subtext">Used for performance analysis</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon">⭐</span>
            <span className="stat-title">Average GPA</span>
          </div>
          <div className="stat-value">
            {stats?.avgGpa ? Number(stats.avgGpa).toFixed(2) : "N/A"}
          </div>
          <div className="stat-subtext">Across all uploaded performance</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        {/* Students per institution 
        <div className="chart-area">
          <h3>Students by Institution</h3>
          {institutionData.length === 0 ? (
            <p className="muted">No institution data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={institutionData}>
                <CartesianGrid stroke="#e0e0e0" strokeDasharray="3 3" />
                <XAxis
                  dataKey="institution"
                  hide={institutionData.length > 5}
                />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#009639" />
              </BarChart>
            </ResponsiveContainer>
          )}
          {institutionData.length > 5 && (
            <ul className="chart-legend">
              {institutionData.slice(0, 6).map((inst) => (
                <li key={inst.institution}>
                  {inst.institution}: {inst.count}
                </li>
              ))}
            </ul>
          )}
        </div>*/}

        {/* Docs by type 
        <div className="chart-area">
          <h3>Documents by Type</h3>
          {docsTypeData.length === 0 ? (
            <p className="muted">No documents uploaded yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={docsTypeData}>
                <CartesianGrid stroke="#e0e0e0" strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0064c8" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>*/}
      </div>

      {/* GPA by year */}
      <div className="chart-area full-width">
        <h3>Average GPA by Year of Study</h3>
        {gpaYearData.length === 0 ? (
          <p className="muted">No GPA records available yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={gpaYearData}>
              <CartesianGrid stroke="#e0e0e0" strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="avgGpa"
                stroke="#ff9800"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom section: latest docs + institution summary */}
      <div className="bottom-row">
        {/* Latest documents */}
        <div className="latest-docs-card">
          <h3>Latest Uploaded Documents</h3>
          {latestDocs.length === 0 ? (
            <p className="muted">No documents uploaded yet.</p>
          ) : (
            <table className="latest-docs-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Type</th>
                  <th>Period</th>
                  <th>Date</th>
                  <th>View</th>
                </tr>
              </thead>
              <tbody>
                {latestDocs.map((doc) => (
                  <tr key={doc._id}>
                    <td>{doc.name || doc.userId?.fullName || "Unknown"}</td>
                    <td>{doc.documentType}</td>
                    <td>{doc.academicPeriod}</td>
                    <td>
                      {doc.createdAt
                        ? new Date(doc.createdAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="view-link"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Institutions summary */}
        <div className="institutions-card">
          <h3>Institutions Summary</h3>
          {institutionData.length === 0 ? (
            <p className="muted">No institution data yet.</p>
          ) : (
            <ul className="institution-list">
              {institutionData.map((inst) => (
                <li key={inst.institution}>
                  <span className="inst-name">{inst.institution}</span>
                  <span className="inst-count">{inst.count} students</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
