import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { API_URL } from "../../utils/config";

import AdminSidebar from "../../components/admin/AdminSidebar";

import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

import "../../styles/admin/AdminLayoutBase.css";
import "../../styles/admin/AdminInstitutionDetail.css";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
);

export default function AdminInstitutionDetail() {
  const token = localStorage.getItem("token");
  const { id } = useParams();

  const [instData, setInstData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_URL}/api/admin/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInstData(res.data);
    } catch (err) {
      console.error("INSTITUTION DETAIL ERROR:", err);
      alert("Failed to load institution details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading || !instData) return <p>Loading...</p>;

  const { institution, stats, students } = instData;

  const chartLabels = stats?.performanceByYear?.map((p) => p.year) || [];
  const chartValues = stats?.performanceByYear?.map((p) => p.avgGpa) || [];

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: "Avg GPA",
        data: chartValues,
        borderColor: "#009639",
        backgroundColor: "rgba(0,150,57,0.25)",
        tension: 0.3,
        pointRadius: 4,
      },
    ],
  };

  const chartOptions = {
    scales: {
      y: {
        suggestedMin: 0,
        suggestedMax: 5,
        title: { display: true, text: "Average GPA (0–5)" },
      },
    },
    plugins: {
      legend: { display: false },
    },
  };

  return (
    <div className="admin-layout-wrapper">
      <AdminSidebar />

      <main className="admin-main-content admin-inst-detail-content">
        {/* HEADER */}
        <div className="inst-detail-header">
          <div className="inst-main-info">
            {institution.logoUrl ? (
              <img
                src={institution.logoUrl}
                alt={institution.name}
                className="inst-logo-large"
              />
            ) : (
              <div className="inst-logo-large placeholder" />
            )}

            <div>
              <h2>{institution.name}</h2>
              <p className="inst-meta">
                <span className="tag">{institution.type}</span>
                {institution.county && (
                  <span className="meta-pill">{institution.county}</span>
                )}
                {institution.location && (
                  <span className="meta-pill">{institution.location}</span>
                )}
              </p>
              {institution.description && (
                <p className="inst-desc">{institution.description}</p>
              )}
            </div>
          </div>

          <div className="inst-stats-pills">
            <div className="pill">
              <span className="pill-label">Students</span>
              <span className="pill-value">
                {stats?.studentCount ?? 0}
              </span>
            </div>
            <div className="pill">
              <span className="pill-label">Documents</span>
              <span className="pill-value">
                {stats?.documentCount ?? 0}
              </span>
            </div>
            <div className="pill">
              <span className="pill-label">Avg GPA</span>
              <span className="pill-value">
                {stats?.avgGpa ?? "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* PERFORMANCE CARD */}
        <section className="inst-card">
          <h3>📊 Performance Summary</h3>
          {chartLabels.length === 0 ? (
            <p className="muted">No performance data for this institution yet.</p>
          ) : (
            <div className="inst-chart-wrap">
              <Line data={chartData} options={chartOptions} />
            </div>
          )}
        </section>

        {/* STUDENTS TABLE */}
        <section className="inst-card">
          <h3>👥 Sponsored Students in this Institution</h3>
          <div className="inst-students-table-wrap">
            <table className="inst-students-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Admission No</th>
                  <th>Course</th>
                  <th>Year</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s._id}>
                    <td>{s.fullName || "—"}</td>
                    <td>{s.admissionNo || "—"}</td>
                    <td>{s.course || "—"}</td>
                    <td>{s.year || "—"}</td>
                  </tr>
                ))}
                {!students.length && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center" }}>
                      No students mapped to this institution yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
