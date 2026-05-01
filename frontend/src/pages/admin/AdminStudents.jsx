// src/pages/admin/AdminStudents.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API_URL } from "../../utils/config";

import AdminSidebar from "../../components/admin/AdminSidebar";
import "../../styles/admin/AdminStudents.css";

export default function AdminStudents() {
  const token = localStorage.getItem("token");

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // filters
  const [search, setSearch] = useState("");
  const [institutionType, setInstitutionType] = useState("");
  const [institutionId, setInstitutionId] = useState("");
  const [year, setYear] = useState("");

  // institutions list
  const [institutions, setInstitutions] = useState([]);

  const ITEMS_PER_PAGE = 4;
  const [page, setPage] = useState(1);


  /* ================= LOAD INSTITUTIONS ================= */
  const loadInstitutions = async (type) => {
    if (!type) {
      setInstitutions([]);
      setInstitutionId("");
      return;
    }

    try {
      const res = await axios.get(
        `${API_URL}/api/admin/institutions?type=${type}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setInstitutions(res.data || []);
      setInstitutionId("");
    } catch (err) {
      console.error("INSTITUTION LOAD ERROR:", err);
      setInstitutions([]);
    }
  };

  /* ================= FETCH STUDENTS ================= */
  const fetchRows = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (search) params.append("search", search);
      if (institutionType) params.append("institutionType", institutionType);
      if (institutionId) params.append("institutionId", institutionId);
      if (year) params.append("year", year);

      const res = await axios.get(
        `${API_URL}/api/admin/students?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setRows(res.data || []);
    } catch (err) {
      console.error("FETCH STUDENTS ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async (userId) => {
    const yes = window.confirm("Are you sure you want to delete this student?");
    if (!yes) return;

    try {
      await axios.delete(`${API_URL}/api/admin/students/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setRows((prev) => prev.filter((s) => s.userId !== userId));
      alert("Student deleted successfully.");
    } catch (err) {
      console.error("DELETE ERROR:", err);
      alert("Failed to delete student.");
    }
  };

  /* ================= INITIAL LOAD ================= */
  useEffect(() => {
    fetchRows();
  }, []);

  useEffect(() => {
  setPage(1);
 }, [search, institutionType, institutionId, year]);

 const totalPages = Math.ceil(rows.length / ITEMS_PER_PAGE);

 const paginatedRows = rows.slice(
  (page - 1) * ITEMS_PER_PAGE,
  page * ITEMS_PER_PAGE
 );



  return (
    <div className="admin-page-container">
      <AdminSidebar />

      <main className="admin-page-content">
        <h2 className="page-title">👥 Students</h2>

        {/* ================= FILTER BAR ================= */}
        <div className="admin-filterbar">
          {/* SEARCH */}
          <input
            placeholder="Search name, email, admission..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* INSTITUTION TYPE */}
          <select
            value={institutionType}
            onChange={(e) => {
              setInstitutionType(e.target.value);
              loadInstitutions(e.target.value);
            }}
          >
            <option value="">All Institution Types</option>
            <option value="University">University</option>
            <option value="TVET">TVET / College</option>
          </select>

          {/* INSTITUTION LIST (DYNAMIC) */}
          <select
            value={institutionId}
            onChange={(e) => setInstitutionId(e.target.value)}
            disabled={!institutions.length}
          >
            <option value="">
              {institutionType
                ? "Select Institution"
                : "Select Institution Type First"}
            </option>

            {institutions.map((i) => (
              <option key={i._id} value={i._id}>
                {i.name}
              </option>
            ))}
          </select>

          {/* YEAR */}
          <select value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">All Years</option>
            {[1, 2, 3, 4, 5].map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>

          {/* APPLY */}
          <button onClick={fetchRows} disabled={loading}>
            {loading ? "Filtering..." : "Filter"}
          </button>
        </div>

        {/* ================= TABLE ================= */}
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
                <th>Status</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {paginatedRows.map((r) => (
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
                    <span className={`status-badge ${r.status || "pending"}`}>
                      {r.status || "pending"}
                    </span>
                  </td>

                  <td className="action-buttons">
                    <Link
                      className="btn-link"
                      to={`/admin-dashboard/students/${r.userId}`}
                    >
                      View
                    </Link>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(r.userId)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {!rows.length && !loading && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center" }}>
                    No students found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {totalPages > 1 && (
  <div className="pagination">
    <button
      disabled={page === 1}
      onClick={() => setPage((p) => p - 1)}
    >
      ◀ Prev
    </button>

    {[...Array(totalPages)].map((_, i) => (
      <button
        key={i}
        className={page === i + 1 ? "active" : ""}
        onClick={() => setPage(i + 1)}
      >
        {i + 1}
      </button>
    ))}

    <button
      disabled={page === totalPages}
      onClick={() => setPage((p) => p + 1)}
    >
      Next ▶
    </button>
  </div>
)}

        </div>
      </main>
    </div>
  );
}
