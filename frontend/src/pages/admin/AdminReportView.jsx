import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_URL } from "../../utils/config";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { downloadFile } from "../../utils/downloadFile";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
  CartesianGrid, Legend
} from "recharts";

import "../../styles/admin/AdminReportView.css";

const COLORS = ["#0a7cff", "#28a745", "#ffc107", "#dc3545", "#6f42c1"];

export default function AdminReportView() {
  const token = localStorage.getItem("token");
  const reportId = window.location.pathname.split("/").pop();

  /* ================= STATE ================= */
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ================= FETCH ================= */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/api/reports/report/${reportId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setReport(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load report");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [reportId, token]);

  /* ================= SAFE NORMALIZATION ================= */
  const institution = report?.institution || {};
  const institutionType = report?.institutionType || "Unknown";
  const analysis = report?.analysis || {};

  const overview = analysis.overview || {};
  const breakdowns = analysis.breakdowns || {};
  const fees = analysis.fees || {};
  const recommendations = analysis.recommendations || [];

  /* ================= MEMOS (ALWAYS RUN) ================= */
  const studentsChart = useMemo(() => {
    if (!breakdowns) return [];
    if (institutionType === "HighSchool") {
      return Object.entries(breakdowns.studentsByClass || {}).map(([k, v]) => ({
        label: k,
        value: v,
      }));
    }
    return Object.entries(breakdowns.students || {}).map(([k, v]) => ({
      label: k,
      value: v,
    }));
  }, [breakdowns, institutionType]);

  const feePie = useMemo(() => {
    if (!fees) return [];
    if (institutionType === "HighSchool") {
      return [
        { name: "Paid", value: fees.paid || 0 },
        {
          name: "Outstanding",
          value: (fees.expected || 0) - (fees.paid || 0),
        },
      ];
    }
    return Object.entries(fees.byProcessingStatus || {}).map(([k, v]) => ({
      name: k,
      value: v,
    }));
  }, [fees, institutionType]);

  /* ================= DOWNLOADS ================= */
  const downloadPdf = () =>
    downloadFile({
      url: `${API_URL}/api/reports/report/${reportId}/download/pdf`,
      token,
      filename: `${(institution.name || "Institution").replace(/[^\w\-]+/g, "_")}_Report.pdf`,
    });

  const downloadExcel = () =>
    downloadFile({
      url: `${API_URL}/api/reports/report/${reportId}/download/excel`,
      token,
      filename: `${(institution.name || "Institution").replace(/[^\w\-]+/g, "_")}_Report.xlsx`,
    });

  /* ================= RENDER ================= */
  return (
    <div className="admin-page-container">
      <AdminSidebar />

      <main className="admin-page-content report-page">

        {loading && <p className="muted">Loading report…</p>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && report && (
          <>
            {/* HEADER */}
            <div className="report-header">
              <div>
                <h1>{institution.name}</h1>
                <p className="muted">
                  {institutionType} Institution Report • Generated on{" "}
                  {new Date(report.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="report-actions">
                <button onClick={downloadPdf}>Download PDF</button>
                <button onClick={downloadExcel}>Download Excel</button>
              </div>
            </div>

            {/* SUMMARY */}
            <section className="report-section">
              <h2>Executive Summary</h2>
              <p>
                <b>{institution.name}</b> has{" "}
                <b>{overview.totalStudents || 0}</b> registered students.
              </p>
            </section>

            {/* STUDENTS */}
            {/* ================= C. STUDENT LIST ================= */}
<section className="report-section">
  <h2>C. Students List</h2>

  <div className="table-wrap">
    <table className="admin-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Admission No</th>
          <th>Name</th>
          {institutionType === "HighSchool" ? (
            <th>Class / Form</th>
          ) : (
            <>
              <th>Course</th>
              <th>Year</th>
            </>
          )}
        </tr>
      </thead>

      <tbody>
        {(analysis.students || []).length === 0 && (
          <tr>
            <td colSpan={institutionType === "HighSchool" ? 4 : 5} style={{ textAlign: "center" }}>
              No student data available in this report
            </td>
          </tr>
        )}

        {(analysis.students || []).map((s, i) => (
          <tr key={i}>
            <td>{i + 1}</td>
            <td>{s.admissionNo || "—"}</td>
            <td>{s.fullName || "—"}</td>

            {institutionType === "HighSchool" ? (
              <td>{s.class || s.form || "—"}</td>
            ) : (
              <>
                <td>{s.course || "—"}</td>
                <td>{s.year || "—"}</td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</section>

 {/* ================= F. FINANCIAL ANALYSIS ================= */}
<section className="report-section">
  <h2>F. Financial Summary</h2>

  <div className="stats-grid">
    <div>
      <b>Total Expected</b><br />
      KES {Number(fees.expected || 0).toLocaleString()}
    </div>

    <div>
      <b>Total Paid</b><br />
      KES {Number(fees.paid || 0).toLocaleString()}
    </div>

    <div>
      <b>Outstanding Balance</b><br />
      KES {Number((fees.expected || 0) - (fees.paid || 0)).toLocaleString()}
    </div>
  </div>

  {/* OPTIONAL VISUAL */}
  <ResponsiveContainer width="100%" height={280}>
    <PieChart>
      <Pie
        data={[
          { name: "Paid", value: fees.paid || 0 },
          {
            name: "Outstanding",
            value: (fees.expected || 0) - (fees.paid || 0),
          },
        ]}
        dataKey="value"
        nameKey="name"
        label
      >
        <Cell fill="#28a745" />
        <Cell fill="#dc3545" />
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  </ResponsiveContainer>
</section>


            {/* RECOMMENDATIONS */}
            <section className="report-section">
              <h2>Recommendations</h2>
              <ol>
                {recommendations.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ol>
            </section>
            
          </>
        )}
      </main>
    </div>
  );
}
