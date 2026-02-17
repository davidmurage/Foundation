import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../utils/config";
import AdminSidebar from "../../components/admin/AdminSidebar";

import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, Legend
} from "recharts";

import "../../styles/admin/AdminFeedbackAnalytics.css";
import { useNavigate } from "react-router-dom";

export default function AdminFeedbackAnalytics() {
  const token = localStorage.getItem("token");
  const [data, setData] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  const load = async () => {
    const res = await axios.get(`${API_URL}/api/feedback/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setData(res.data);
  };

  if (!data) return <p style={{ padding: 20 }}>Loading analytics…</p>;

  const avg = data.avgResponseMs
    ? `${Math.round(data.avgResponseMs / 60000)} mins`
    : "N/A";

  return (
    <div className="admin-page-container">
      <AdminSidebar />

      <main className="admin-page-content analytics-page">
        <button
              className="back-btn"
              onClick={() => navigate(-1)}
            >
               ← Back
            </button>
        <h2>📊 Support Analytics</h2>

        <div className="cards">
          <div className="card"><b>Total Threads</b><br />{data.totals.total}</div>
          <div className="card"><b>Open</b><br />{data.totals.open}</div>
          <div className="card"><b>Resolved</b><br />{data.totals.resolved}</div>
          <div className="card"><b>Avg Response</b><br />{avg}</div>
        </div>

        <div className="grid">
          <div className="panel">
            <h3>Top Pages by Complaints</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.byPage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="page" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="panel">
            <h3>Threads Created (Last 14 days)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.perDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}
