import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../utils/config";


import "../../styles/highschool/HighSchoolDashboard.css";
import HighSchoolSidebar from "../../components/Highschool/HighSchoolSidebar";



export default function HighSchoolDashboard() {
  const token = localStorage.getItem("token");
  const [data, setData] = useState(null);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/dashboard/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setData(res.data))
      .catch(() => alert("Failed to load dashboard"));
  }, [token]);

  if (!data) return <p>Loading dashboard...</p>;

  return (
    <div className="hs-layout">
      <HighSchoolSidebar />

      <main className="hs-main">
        <h2>🏫 School Dashboard</h2>

        {/* STAT CARDS */}
        <div className="stats-grid">
          <div className="stat-card">
            <h4>👨‍🎓 Students</h4>
            <strong>{data.totalStudents}</strong>
          </div>

          <div className="stat-card">
            <h4>📄 Pending Students</h4>
            <strong>{data.pendingFees}</strong>
          </div>

          <div className="stat-card">
            <h4>💰 Total Fees</h4>
            <strong>KES {data.totalFees.toLocaleString()}</strong>
          </div>
        </div>

        
        {/* STUDENTS BY GRADE */}
<div className="section-card">
  <h3>📚 Enrollment by Grade / Form</h3>

  {data.byGrade.length === 0 ? (
    <p className="muted">No student records found</p>
  ) : (
    <ul className="grade-list">
      {data.byGrade.map((g) => (
        <li key={g._id}>
          <span>{g._id}</span>
          <strong>{g.count}</strong>
        </li>
      ))}
    </ul>
  )}
</div>

{/* INSIGHTS */}
<div className="section-card">
  <h3>📊 School Insights</h3>

  <ul className="insights">
    <li>
      👨‍🎓 Average students per class:{" "}
      <strong>
        {data.byGrade.length
          ? Math.round(data.totalStudents / data.byGrade.length)
          : 0}
      </strong>
    </li>

    <li>
      💰 Pending registered students:{" "}
      <strong>{data.pendingFees}</strong>
    </li>

    <li>
      📄 Fee processing efficiency:{" "}
      <strong>
        {data.pendingFees === 0 ? "Excellent" : "Needs Attention"}
      </strong>
    </li>
  </ul>
</div>
      </main>
    </div>
  );
}
