import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_URL } from "../../utils/config";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { downloadFile } from "../../utils/downloadFile";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from "recharts";

import "../../styles/admin/AdminReportView.css";

const COLORS = ["#087a45", "#dc3545", "#185abc", "#f59e0b", "#6f42c1"];

export default function AdminReportView() {
  const token = localStorage.getItem("token");
  const reportId = window.location.pathname.split("/").pop();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/reports/report/${reportId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
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

  const analysis = report?.analysis || {};
  const overview = analysis.overview || {};
  const finance = analysis.finance || {};
  const campus = analysis.campus || {};
  const highSchool = analysis.highSchool || {};
  const recommendations = analysis.recommendations || [];
  const title = overview.title || report?.institution?.name || "Institution Report";

  const distribution = useMemo(() => {
    const campusYears = campus.breakdowns?.studentsByYear || {};
    const highSchoolClasses = highSchool.breakdowns?.studentsByClass || {};
    const merged = { ...campusYears, ...highSchoolClasses };
    return Object.entries(merged).map(([label, value]) => ({ label, value }));
  }, [campus, highSchool]);

  const highSchoolFeePie = useMemo(() => {
    const paid = Number(finance.highSchool?.paid || 0);
    const balance = Number(finance.highSchool?.balance || 0);
    return [
      { name: "Paid", value: paid },
      { name: "Outstanding", value: balance },
    ].filter((item) => item.value > 0);
  }, [finance]);

  const downloadPdf = () =>
    downloadFile({
      url: `${API_URL}/api/reports/report/${reportId}/download/pdf`,
      token,
      filename: `${title.replace(/[^\w\-]+/g, "_")}.pdf`,
    });

  const downloadExcel = () =>
    downloadFile({
      url: `${API_URL}/api/reports/report/${reportId}/download/excel`,
      token,
      filename: `${title.replace(/[^\w\-]+/g, "_")}.xlsx`,
    });

  return (
    <div className="admin-page-container">
      <AdminSidebar />

      <main className="admin-page-content report-page">
        {loading && <p className="muted">Loading report...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && report && (
          <>
            <div className="report-header">
              <div>
                <h1>{title}</h1>
                <p className="muted">
                  {report.institutionType} report | {overview.scope || report.reportScope} | Generated{" "}
                  {new Date(report.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="report-actions">
                <button onClick={downloadPdf}>Download PDF</button>
                <button onClick={downloadExcel}>Download Excel</button>
              </div>
            </div>

            <section className="report-section">
              <h2>Executive Summary</h2>
              <p>
                <b>{title}</b> covers <b>{overview.totalStudents || 0}</b> students across{" "}
                <b>{overview.totalInstitutions || 0}</b> institution(s).
              </p>
              <div className="stats-grid">
                <div><b>Institutions</b><br />{overview.totalInstitutions || 0}</div>
                <div><b>Students</b><br />{overview.totalStudents || 0}</div>
                <div><b>Documents</b><br />{overview.totalDocuments || 0}</div>
                <div><b>Scope</b><br />{overview.scope || report.reportScope}</div>
              </div>
            </section>

            <section className="report-section">
              <h2>Institution Summary</h2>
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Institution</th>
                      <th>Type</th>
                      <th>County</th>
                      <th>Students</th>
                      <th>Documents</th>
                      <th>Financial Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(analysis.institutionSummaries || []).map((row, index) => (
                      <tr key={`${row.institution}-${index}`}>
                        <td>{row.institution}</td>
                        <td>{row.type}</td>
                        <td>{row.county || "N/A"}</td>
                        <td>{row.totalStudents || 0}</td>
                        <td>{row.totalDocuments || 0}</td>
                        <td>
                          {row.type === "HighSchool"
                            ? `KES ${Number(row.balance || 0).toLocaleString()} balance`
                            : `KES ${Number(row.amountRequested || 0).toLocaleString()} requested`}
                        </td>
                      </tr>
                    ))}
                    {!(analysis.institutionSummaries || []).length && (
                      <tr><td colSpan={6} style={{ textAlign: "center" }}>No institution data</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="report-section">
              <h2>Students List</h2>
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Institution</th>
                      <th>Name</th>
                      <th>Admission / Reg No</th>
                      <th>Category</th>
                      <th>Course / Class</th>
                      <th>Year / Period</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(analysis.students || []).map((student, index) => (
                      <tr key={`${student.admissionNo}-${index}`}>
                        <td>{index + 1}</td>
                        <td>{student.institution || "N/A"}</td>
                        <td>{student.fullName || "N/A"}</td>
                        <td>{student.admissionNo || "N/A"}</td>
                        <td>{student.category || "N/A"}</td>
                        <td>{student.course || student.level || "N/A"}</td>
                        <td>{student.year || student.academicYear || student.academicPeriod || "N/A"}</td>
                        <td>{student.status || "N/A"}</td>
                      </tr>
                    ))}
                    {!(analysis.students || []).length && (
                      <tr><td colSpan={8} style={{ textAlign: "center" }}>No student data</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="report-section">
              <h2>Financial Summary</h2>
              <div className="stats-grid">
                <div><b>Campus Applications</b><br />{finance.campus?.totalApplications || 0}</div>
                <div>
                  <b>Campus Requested</b><br />
                  KES {Number(finance.campus?.amountRequested || 0).toLocaleString()}
                </div>
                <div>
                  <b>High School Expected</b><br />
                  KES {Number(finance.highSchool?.expected || 0).toLocaleString()}
                </div>
                <div>
                  <b>High School Balance</b><br />
                  KES {Number(finance.highSchool?.balance || 0).toLocaleString()}
                </div>
              </div>

              {highSchoolFeePie.length > 0 && (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={highSchoolFeePie} dataKey="value" nameKey="name" label>
                      {highSchoolFeePie.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </section>

            <section className="report-section">
              <h2>Student Distribution</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={distribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#087a45" />
                </BarChart>
              </ResponsiveContainer>
            </section>

            <section className="report-section">
              <h2>Recommendations</h2>
              <ol>
                {recommendations.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ol>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
