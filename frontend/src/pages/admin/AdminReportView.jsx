import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_URL } from "../../utils/config";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { downloadFile } from "../../utils/downloadFile";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
  CartesianGrid, LineChart, Line, Legend
} from "recharts";

import "../../styles/admin/AdminReportView.css";

const COLORS = ["#0a7cff", "#28a745", "#ffc107", "#dc3545", "#6f42c1"];

export default function AdminReportView() {
  const token = localStorage.getItem("token");
  const reportId = window.location.pathname.split("/").pop();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ---------------- FETCH REPORT ---------------- */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/api/reports/report/${reportId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setData(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load report");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [reportId, token]);

  /* ---------------- SAFE NORMALIZATION ---------------- */
  const institution = data?.institution || {};
  const institutionType = data?.institutionType || "Unknown";

  const analysis = data?.analysis || {};
  const overview = analysis.overview || {};
  const feeStats = analysis.feeStats || {};
  const byReviewStatus = feeStats.byReviewStatus || {};
  const byProcessingStatus = feeStats.byProcessingStatus || {};
  const recommendations = analysis.recommendations || [];
  const riskStudents = analysis.riskStudents || [];

  /* ---------------- DATA PREP ---------------- */
  const studentsByYear = useMemo(() => {
    const src = analysis.studentsByYear || analysis.studentsByForm || {};
    return Object.entries(src).map(([k, v]) => ({ label: k, value: v }));
  }, [analysis]);

  const docsByType = useMemo(() => {
    const src = analysis.docsByType || {};
    return Object.entries(src).map(([k, v]) => ({ name: k, value: v }));
  }, [analysis]);

  const gpaTrend = Array.isArray(analysis.gpaByYear)
    ? analysis.gpaByYear
    : [];

  const feeStatusChart = Object.entries(byProcessingStatus).map(
    ([k, v]) => ({ name: k, value: v })
  );

  /* ---------------- DOWNLOADS ---------------- */
  const downloadPdf = () =>
    downloadFile({
      url: `${API_URL}/api/reports/institution/${institution._id}/download/pdf`,
      token,
      filename: `${institution.name}_Report.pdf`,
    });

  const downloadExcel = () =>
    downloadFile({
      url: `${API_URL}/api/reports/institution/${institution._id}/download/excel`,
      token,
      filename: `${institution.name}_Report.xlsx`,
    });

  /* ---------------- STATES ---------------- */
  if (loading) return <p className="muted">Loading report…</p>;
  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="error">No report data available</p>;

  /* =================== RENDER =================== */
  return (
    <div className="admin-page-container">
      <AdminSidebar />

      <main className="admin-page-content report-page">

        {/* ================= HEADER ================= */}
        <div className="report-header">
          <div>
            <h1>{institution.name}</h1>
            <p className="muted">
              {institutionType} Institution Report • Generated on{" "}
              {new Date(data.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="report-actions">
            <button onClick={downloadPdf}>Download PDF</button>
            <button onClick={downloadExcel}>Download Excel</button>
          </div>
        </div>

        {/* ================= A. EXECUTIVE SUMMARY ================= */}
        <section className="report-section">
          <h2>A. Executive Summary</h2>
          <p>
            This institutional report provides a comprehensive analysis of
            <b> {institution.name}</b>, focusing on student enrollment,
            academic performance, sponsorship funding, and compliance.
          </p>
          <p>
            A total of <b>{overview.totalStudents || 0}</b> students are
            currently registered, with an average academic performance of{" "}
            <b>{overview.avgGpa ?? "N/A"}</b>.
          </p>
        </section>

        {/* ================= B. INSTITUTION METRICS ================= */}
        <section className="report-section">
          <h2>B. Institutional Metrics</h2>

          <div className="stats-grid">
            <div><b>Total Students</b><br />{overview.totalStudents || 0}</div>
            <div><b>Total Documents</b><br />{overview.totalDocuments || 0}</div>
            <div><b>Avg GPA / Mean</b><br />{overview.avgGpa ?? "N/A"}</div>
            <div><b>Fee Applications</b><br />{feeStats.totalApplications || 0}</div>
          </div>
        </section>

        {/* ================= C. STUDENT DISTRIBUTION ================= */}
        <section className="report-section">
          <h2>C. Student Demographics</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={studentsByYear}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#0a7cff" />
            </BarChart>
          </ResponsiveContainer>
        </section>

        {/* ================= D. ACADEMIC PERFORMANCE ================= */}
        {gpaTrend.length > 0 && (
          <section className="report-section">
            <h2>D. Academic Performance Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={gpaTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="avgGpa"
                  stroke="#28a745"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </section>
        )}

        {/* ================= E. FINANCIAL ANALYSIS ================= */}
        <section className="report-section">
          <h2>E. Financial & Sponsorship Analysis</h2>

          <div className="stats-grid">
            <div><b>Total Applications</b><br />{feeStats.totalApplications || 0}</div>
            <div><b>Approved</b><br />{byReviewStatus.approved || 0}</div>
            <div><b>Rejected</b><br />{byReviewStatus.rejected || 0}</div>
            <div><b>Paid</b><br />{byProcessingStatus.paid || 0}</div>
            <div><b>Processing</b><br />{byProcessingStatus.processing || 0}</div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={feeStatusChart} dataKey="value" nameKey="name" label>
                {feeStatusChart.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </section>

        {/* ================= F. RISK & COMPLIANCE ================= */}
        <section className="report-section">
          <h2>F. Risk & Compliance Assessment</h2>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Admission</th>
                <th>Issue</th>
                <th>Score / GPA</th>
              </tr>
            </thead>
            <tbody>
              {riskStudents.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center" }}>
                    No risk indicators detected
                  </td>
                </tr>
              )}
              {riskStudents.map((r, i) => (
                <tr key={i}>
                  <td>{r.name || "—"}</td>
                  <td>{r.admissionNo || "—"}</td>
                  <td>{r.reason || "—"}</td>
                  <td>{r.gpa ?? r.meanScore ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* ================= G. RECOMMENDATIONS ================= */}
        <section className="report-section">
          <h2>G. Recommendations</h2>
          <ol>
            {recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ol>
        </section>

        {/* ================= H. APPENDIX ================= */}
        <section className="report-section">
          <h2>H. Appendix & Methodology</h2>
          <p>
            This report was generated using institutional student profiles,
            academic performance records, document compliance data, and
            sponsorship application workflows stored in the KCB system.
          </p>
          <p>
            Metrics reflect data available at the time of generation and may
            change as new records are submitted or updated.
          </p>
        </section>

      </main>
    </div>
  );
}
