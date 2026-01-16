import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_URL } from "../../utils/config";
import { downloadFile } from "../../utils/downloadFile";
import AdminSidebar from "../../components/admin/AdminSidebar";
import "../../styles/admin/AdminReports.css";

export default function AdminInstitutionReports() {
  const token = localStorage.getItem("token");

  // generator filters
  const [type, setType] = useState("");
  const [institutions, setInstitutions] = useState([]);
  const [institutionId, setInstitutionId] = useState("");

  // summary
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summary, setSummary] = useState(null);
  const [message, setMessage] = useState("");

  // history
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // history filters
  const [historyType, setHistoryType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const loadInstitutions = async (t) => {
    setLoadingInstitutions(true);
    setMessage("");
    setInstitutions([]);
    setInstitutionId("");
    setSummary(null);

    if (!t) {
      setLoadingInstitutions(false);
      return;
    }

    try {
      const res = await axios.get(`${API_URL}/api/reports/institutions?type=${t}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInstitutions(res.data || []);
    } catch (err) {
      console.error(err);
      setMessage("Failed to load institutions");
    } finally {
      setLoadingInstitutions(false);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    setMessage("");

    try {
      const params = new URLSearchParams();
      if (historyType) params.append("type", historyType);
      if (fromDate) params.append("from", fromDate);
      if (toDate) params.append("to", toDate);

      const res = await axios.get(`${API_URL}/api/reports/history?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setHistory(res.data || []);
    } catch (err) {
      console.error(err);
      setMessage("Failed to load reports history");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line
  }, []);

  const generateSummary = async () => {
    if (!institutionId) return;

    setLoadingSummary(true);
    setMessage("");
    setSummary(null);

    try {
      const res = await axios.get(
        `${API_URL}/api/reports/institution/${institutionId}/summary`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSummary(res.data);
      // refresh history automatically after generating
      await loadHistory();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Failed to generate summary");
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleDownloadPdf = async (instId, instName) => {
    const safe = (instName || "Institution").replace(/[^\w\-]+/g, "_");
    await downloadFile({
      url: `${API_URL}/api/reports/institution/${instId}/download/pdf`,
      token,
      filename: `${safe}_Report.pdf`,
    });
  };

  const handleDownloadExcel = async (instId, instName) => {
    const safe = (instName || "Institution").replace(/[^\w\-]+/g, "_");
    await downloadFile({
      url: `${API_URL}/api/reports/institution/${instId}/download/excel`,
      token,
      filename: `${safe}_Report.xlsx`,
    });
  };

  const goView = (reportId) => {
    window.location.href = `/admin-dashboard/reports/${reportId}`;
  };

  const groupedHistory = useMemo(() => {
    const groups = { University: [], TVET: [], HighSchool: [] };
    for (const r of history) {
      if (!groups[r.institutionType]) groups[r.institutionType] = [];
      groups[r.institutionType].push(r);
    }
    return groups;
  }, [history]);

  return (
    <div className="admin-page-container">
      <AdminSidebar />

      <main className="admin-page-content">
        <h2 className="page-title">📊 Institution Reports & Analysis</h2>

        {message && <p className="report-error">{message}</p>}

        {/* ================= GENERATE REPORT ================= */}
        <section className="card">
          <h3 className="card-title">A) Generate a New Institution Report</h3>

          <div className="report-row">
            <div className="field">
              <label>Institution Type</label>
              <select
                value={type}
                onChange={(e) => {
                  const t = e.target.value;
                  setType(t);
                  loadInstitutions(t);
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
                  {loadingInstitutions
                    ? "Loading institutions..."
                    : type
                    ? "Select Institution"
                    : "Select Type First"}
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
                onClick={generateSummary}
                disabled={!institutionId || loadingSummary}
              >
                {loadingSummary ? "Generating..." : "Generate Summary"}
              </button>
            </div>

            <div className="field actions">
              <label>&nbsp;</label>
              <button
                className="btn"
                onClick={() =>
                  summary?.institution?._id &&
                  handleDownloadPdf(summary.institution._id, summary.institution.name)
                }
                disabled={!summary?.institution?._id}
              >
                Download PDF
              </button>
            </div>

            <div className="field actions">
              <label>&nbsp;</label>
              <button
                className="btn"
                onClick={() =>
                  summary?.institution?._id &&
                  handleDownloadExcel(summary.institution._id, summary.institution.name)
                }
                disabled={!summary?.institution?._id}
              >
                Download Excel
              </button>
            </div>
          </div>

          {/* QUICK PREVIEW */}
          {summary && (
            <div className="preview">
              <h4>
                Preview: {summary.institution?.name} ({summary.institutionType})
              </h4>

              <div className="preview-grid">
                {Object.entries(summary.analysis?.overview || {}).map(([k, v]) => (
                  <div key={k} className="metric">
                    <div className="metric-key">{k}</div>
                    <div className="metric-val">{v === null ? "N/A" : String(v)}</div>
                  </div>
                ))}
              </div>

              <button
                className="btn primary"
                onClick={() => summary.reportId && goView(summary.reportId)}
                disabled={!summary.reportId}
              >
                View Full Report
              </button>
            </div>
          )}
        </section>

        {/* ================= REPORTS HISTORY TABLE ================= */}
        <section className="card">
          <h3 className="card-title">B) Reports History (Saved Records)</h3>

          <div className="report-row">
            <div className="field">
              <label>Filter by Type</label>
              <select value={historyType} onChange={(e) => setHistoryType(e.target.value)}>
                <option value="">All Types</option>
                <option value="University">University</option>
                <option value="TVET">TVET</option>
                <option value="HighSchool">High School</option>
              </select>
            </div>

            <div className="field">
              <label>From</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>

            <div className="field">
              <label>To</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>

            <div className="field actions">
              <label>&nbsp;</label>
              <button className="btn primary" onClick={loadHistory} disabled={loadingHistory}>
                {loadingHistory ? "Loading..." : "Apply Filters"}
              </button>
            </div>
          </div>

          {/* Grouped tables */}
          {["University", "TVET", "HighSchool"].map((k) => (
            <div key={k} className="history-group">
              <h4 className="group-title">
                {k === "HighSchool" ? "High Schools" : k}
              </h4>

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
                        <td>{r.institution?.name || "—"}</td>
                        <td>{new Date(r.createdAt).toLocaleString()}</td>
                        <td className="table-actions">
                          <button className="btn small" onClick={() => goView(r._id)}>
                            View
                          </button>
                          <button
                            className="btn small"
                            onClick={() =>
                              handleDownloadPdf(r.institution?._id, r.institution?.name)
                            }
                            disabled={!r.institution?._id}
                          >
                            PDF
                          </button>
                          <button
                            className="btn small"
                            onClick={() =>
                              handleDownloadExcel(r.institution?._id, r.institution?.name)
                            }
                            disabled={!r.institution?._id}
                          >
                            Excel
                          </button>
                        </td>
                      </tr>
                    ))}

                    {!loadingHistory && !(groupedHistory[k] || []).length && (
                      <tr>
                        <td colSpan={3} style={{ textAlign: "center" }}>
                          No reports found
                        </td>
                      </tr>
                    )}
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
