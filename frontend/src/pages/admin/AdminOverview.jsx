// src/pages/admin/AdminOverview.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/admin/AdminOverview.css";
import { API_URL } from "../../utils/config";
import AdminSidebar from "../../components/admin/AdminSidebar"; // ⬅ IMPORT SIDEBAR HERE
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

  const gpaYearData =
    stats?.gpaByYear?.map((item) => ({
      year: String(item._id ?? ""),
      avgGpa: Number(item.avgGpa || 0),
    })) || [];

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  return (
    <div className="admin-page-container">
      {/* SIDEBAR ALWAYS INCLUDED */}
      <AdminSidebar />

      {/* PAGE CONTENT */}
      <div className={`admin-overview-container ${dark ? "dark" : ""}`}>
        <div className="overview-header">
          <h2>Dashboard Overview</h2>

          <div className="theme-toggle">
            <span>{dark ? "🌙 Dark Mode" : "☀️ Light Mode"}</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={dark}
                onChange={() => setDark(!dark)}
              />
              <span className="slider round"></span>
            </label>
          </div>
        </div>

        {/* ==== STATS CARDS ==== */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-icon">👥</span>
              <span className="stat-title">Total Students</span>
            </div>
            <div className="stat-value">{stats?.totalStudents || 0}</div>
            <div className="stat-subtext">Registered students</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-icon">📘</span>
              <span className="stat-title">Profiles Completed</span>
            </div>
            <div className="stat-value">{stats?.profiledStudents || 0}</div>
            <div className="stat-subtext">Fully completed profiles</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-icon">📄</span>
              <span className="stat-title">Documents Uploaded</span>
            </div>
            <div className="stat-value">{stats?.totalDocuments || 0}</div>
            <div className="stat-subtext">All uploads</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-icon">⭐</span>
              <span className="stat-title">Average GPA</span>
            </div>
            <div className="stat-value">
              {stats?.avgGpa ? Number(stats.avgGpa).toFixed(2) : "N/A"}
            </div>
            <div className="stat-subtext">Performance analysis</div>
          </div>
        </div>

        {/* ==== GPA CHART ==== */}
        <div className="chart-area full-width">
          <h3>Average GPA by Year of Study</h3>

          {gpaYearData.length === 0 ? (
            <p className="muted">No GPA data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={gpaYearData}>
                <CartesianGrid stroke="#e0e0e0" strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="avgGpa" stroke="#009639" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ==== LATEST DOCS ==== */}
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
                    <td>{doc.userId?.fullName || "Unknown"}</td>
                    <td>{doc.documentType}</td>
                    <td>{doc.academicPeriod}</td>
                    <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
                    <td>
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
