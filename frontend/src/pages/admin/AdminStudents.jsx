// src/pages/admin/AdminStudents.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API_URL } from "../../utils/config";

// IMPORT SIDEBAR
import AdminSidebar from "../../components/admin/AdminSidebar";

import "../../styles/admin/AdminStudents.css";

export default function AdminStudents() {
  const token = localStorage.getItem("token");
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState({ institutionType: "", year: "" });
  const [loading, setLoading] = useState(false);

  const fetchRows = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.institutionType) params.append("institutionType", filters.institutionType);
      if (filters.year) params.append("year", filters.year);
      if (q) params.append("search", q);

      const res = await axios.get(`${API_URL}/api/admin/students?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setRows(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  return (
    <div className="admin-page-container">
      {/* SIDEBAR */}
      <AdminSidebar />

      {/* MAIN CONTENT */}
      <main className="admin-page-content">
        <h2 className="page-title">👥 Students</h2>

        {/* FILTER BAR */}
        <div className="admin-filterbar">
          <input
            placeholder="Search name, email, admission..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />

          <select
            value={filters.institutionType}
            onChange={(e) => setFilters({ ...filters, institutionType: e.target.value })}
          >
            <option value="">All Institutions</option>
            <option value="University">University</option>
            <option value="TVET">TVET / College</option>
          </select>

          <select
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
          >
            <option value="">All Years</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
            <option value="5">Year 5</option>
          </select>

          <button onClick={fetchRows} disabled={loading}>
            Filter
          </button>
        </div>

        {/* TABLE */}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Name / Email</th>
                <th>Admission</th>
                <th>Institution</th>
                <th>Course</th>
                <th>Year</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => (
                <tr key={r.userId}>
                  <td>
                    {r.photo ? (
                      <img src={r.photo} className="mini-avatar" />
                    ) : (
                      "—"
                    )}
                  </td>

                  <td>
                    <div className="cell-main">{r.fullName}</div>
                    <div className="cell-sub">{r.email}</div>
                  </td>

                  <td>{r.admissionNo}</td>
                  <td>{r.institution}</td>
                  <td>{r.course}</td>
                  <td>{r.year}</td>

                  <td>
                    <Link className="btn-link" to={`/admin-dashboard/students/${r.userId}`}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}

              {!rows.length && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center" }}>
                    No results found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
