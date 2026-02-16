import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_URL } from "../../utils/config";
import { downloadFile } from "../../utils/downloadFile";

import AdminSidebar from "../../components/admin/AdminSidebar";
import "../../styles/admin/AdminReports.css";

export default function AdminInstitutionReports() {
  const token = localStorage.getItem("token");

  /* =======================
     GENERATE REPORT
  ======================= */
  const [type, setType] = useState("");
  const [institutions, setInstitutions] = useState([]);
  const [institutionId, setInstitutionId] = useState("");

  const [loadingInstitutions, setLoadingInstitutions] = useState(false);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [report, setReport] = useState(null);
  const [message, setMessage] = useState("");

  /* =======================
     HISTORY
  ======================= */
  const [historyType, setHistoryType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPages, setHistoryPages] = useState(1);

  /* =======================
     LOAD INSTITUTIONS
  ======================= */
  const loadInstitutions = async (t) => {
    setLoadingInstitutions(true);
    setMessage("");
    setInstitutions([]);
    setInstitutionId("");
    setReport(null);

    if (!t) {
      setLoadingInstitutions(false);
      return;
    }

    try {
      const res = await axios.get(
        `${API_URL}/api/reports/institutions?type=${t}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInstitutions(res.data || []);
    } catch (err) {
      console.error(err);
      setMessage("Failed to load institutions");
    } finally {
      setLoadingInstitutions(false);
    }
  };

  /* =======================
     LOAD HISTORY
  ======================= */
  const loadHistory = async (page = 1) => {
    setHistoryLoading(true);
    setMessage("");

    try {
      const params = new URLSearchParams();
      if (historyType) params.append("type", historyType);
      if (fromDate) params.append("from", fromDate);
      if (toDate) params.append("to", toDate);
      params.append("page", page);
      params.append("limit", 30);

      const res = await axios.get(
        `${API_URL}/api/reports/history?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setHistory(res.data.items || []);
      setHistoryPage(res.data.page || 1);
      setHistoryPages(res.data.pages || 1);
    } catch (err) {
      console.error(err);
      setMessage("Failed to load reports history");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(1);
    // eslint-disable-next-line
  }, []);

  /* =======================
     GENERATE REPORT
  ======================= */
  const generateReport = async () => {
    if (!institutionId) return;

    setLoadingGenerate(true);
    setMessage("");
    setReport(null);

    try {
      const res = await axios.post(
        `${API_URL}/api/reports/generate`,
        { institutionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setReport(res.data);
      await loadHistory(1);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Failed to generate report");
    } finally {
      setLoadingGenerate(false);
    }
  };

  /* =======================
     DOWNLOADS
  ======================= */
  const downloadPdf = async (reportId, name) => {
    await downloadFile({
      url: `${API_URL}/api/reports/report/${reportId}/download/pdf`,
      token,
      filename: `${(name || "Institution").replace(/[^\w\-]+/g, "_")}_Report.pdf`,
    });
  };

  const downloadExcel = async (reportId, name) => {
    await downloadFile({
      url: `${API_URL}/api/reports/report/${reportId}/download/excel`,
      token,
      filename: `${(name || "Institution").replace(/[^\w\-]+/g, "_")}_Report.xlsx`,
    });
  };

  const viewReport = (id) => {
    window.location.href = `/admin-dashboard/reports/${id}`;
  };

  /* =======================
     PREVIEW HELPERS
  ======================= */
  const previewMetrics = useMemo(() => {
    if (!report?.analysis?.overview) return [];
    return Object.entries(report.analysis.overview);
  }, [report]);

  const renderFinancialPreview = () => {
    const fees = report?.analysis?.fees;
    if (!fees) return null;

    // High School fees
    if ("expected" in fees || "paid" in fees) {
      return (
        <div className="preview-section">
          <h5>💰 Financial Summary (High School)</h5>
          <div className="preview-grid">
            <div className="metric">
              <div className="metric-key">Total Fees Expected</div>
              <div className="metric-val">
                KES {Number(fees.expected || 0).toLocaleString()}
              </div>
            </div>
            <div className="metric">
              <div className="metric-key">Total Fees Paid</div>
              <div className="metric-val">
                KES {Number(fees.paid || 0).toLocaleString()}
              </div>
            </div>
            <div className="metric">
              <div className="metric-key">Outstanding Balance</div>
              <div className="metric-val">
                KES {Number((fees.expected || 0) - (fees.paid || 0)).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // University / TVET fees
    return (
      <div className="preview-section">
        <h5>💰 Financial Summary (University / TVET)</h5>
        <div className="preview-grid">
          <div className="metric">
            <div className="metric-key">Total Fee Applications</div>
            <div className="metric-val">{fees.totalApplications || 0}</div>
          </div>
        </div>
      </div>
    );
  };

  /* =======================
     GROUP HISTORY
  ======================= */
  const groupedHistory = useMemo(() => {
    const g = { University: [], TVET: [], HighSchool: [] };
    history.forEach((r) => {
      if (g[r.institutionType]) g[r.institutionType].push(r);
    });
    return g;
  }, [history]);

  /* =======================
     RENDER
  ======================= */
  return (
    <div className="admin-page-container">
      <AdminSidebar />

      <main className="admin-page-content">
        <h2 className="page-title">📊 Institution Reports & Analysis</h2>
        {message && <p className="report-error">{message}</p>}

        {/* ================= GENERATE ================= */}
        <section className="card">
          <h3 className="card-title">A) Generate a New Report</h3>

          <div className="report-row">
            <div className="field">
              <label>Institution Type</label>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  loadInstitutions(e.target.value);
                }}
              >
                <option value="">Select Type</option>
                <option value="University">University</option>
                <option value="TVET">TVET</option>
                <option value="HighSchool">High School</option>
              </select>
            </div>

            <div className="field">
              <label>Institution</label>
              <select
                value={institutionId}
                onChange={(e) => setInstitutionId(e.target.value)}
                disabled={!type || loadingInstitutions}
              >
                <option value="">
                  {loadingInstitutions ? "Loading..." : "Select Institution"}
                </option>
                {institutions.map((i) => (
                  <option key={i._id} value={i._id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field actions">
              <label>&nbsp;</label>
              <button
                className="btn primary"
                onClick={generateReport}
                disabled={!institutionId || loadingGenerate}
              >
                {loadingGenerate ? "Generating..." : "Generate Report"}
              </button>
            </div>
          </div>

          {/* PREVIEW */}
          {report && (
            <div className="preview">
              <h4>
                Preview: {report.institution?.name} ({report.institutionType})
              </h4>

              <div className="preview-section">
                <h5>📊 Overview</h5>
                <div className="preview-grid">
                  {previewMetrics.map(([k, v]) => (
                    <div key={k} className="metric">
                      <div className="metric-key">{k}</div>
                      <div className="metric-val">{v ?? "N/A"}</div>
                    </div>
                  ))}
                </div>
              </div>

              {renderFinancialPreview()}

              <div style={{ display: "flex", gap: 10, marginTop: 15 }}>
                <button className="btn primary" onClick={() => viewReport(report._id)}>
                  View Full Report
                </button>
                <button className="btn" onClick={() => downloadPdf(report._id, report.institution?.name)}>
                  PDF
                </button>
                <button className="btn" onClick={() => downloadExcel(report._id, report.institution?.name)}>
                  Excel
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ================= HISTORY ================= */}
        <section className="card">
          <h3 className="card-title">B) Reports History</h3>

          {["University", "TVET", "HighSchool"].map((k) => (
            <div key={k} className="history-group">
              <h4 className="group-title">{k === "HighSchool" ? "High Schools" : k}</h4>
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Institution</th>
                      <th>Generated At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(groupedHistory[k] || []).map((r) => (
                      <tr key={r._id}>
                        <td>{r.institution?.name}</td>
                        <td>{new Date(r.createdAt).toLocaleString()}</td>
                        <td>
                          <button className="btn small" onClick={() => viewReport(r._id)}>View</button>
                          <button className="btn small" onClick={() => downloadPdf(r._id, r.institution?.name)}>PDF</button>
                          <button className="btn small" onClick={() => downloadExcel(r._id, r.institution?.name)}>Excel</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
