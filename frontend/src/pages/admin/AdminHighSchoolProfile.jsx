import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../utils/config";

import AdminSidebar from "../../components/admin/AdminSidebar";
import "../../styles/admin/AdminLayoutBase.css";
import "../../styles/admin/AdminHighSchoolProfile.css";

export default function AdminHighSchoolProfile() {
  const { schoolId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [tab, setTab] = useState("overview");
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(false);

  // filters for students tab
  const [filters, setFilters] = useState({
    search: "",
    gender: "",
    curriculum: "",
    academicYear: "",
    approvalStatus: "",
  });

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/highschools/highschools/${schoolId}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBundle(res.data);
    } catch (e) {
      alert(e.response?.data?.message || "Failed to load school profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [schoolId]);

  const approveReject = async (studentId, status) => {
    if (!window.confirm(`${status} this student?`)) return;

    try {
      await axios.patch(
        `${API_URL}/api/highschools/students/${studentId}/approval`,
        { status }, // "Approved" | "Rejected" | "Pending"
        { headers: { Authorization: `Bearer ${token}` } }
      );
      load();
    } catch (e) {
      alert(e.response?.data?.message || "Approval action failed");
    }
  };

  const filteredStudents = useMemo(() => {
    if (!bundle?.students) return [];

    return bundle.students.filter((s) => {
      const nameOk =
        !filters.search ||
        (s.fullName || "").toLowerCase().includes(filters.search.toLowerCase());

      const genderOk = !filters.gender || s.gender === filters.gender;
      const currOk = !filters.curriculum || s.curriculum === filters.curriculum;
      const yearOk = !filters.academicYear || String(s.academicYear) === String(filters.academicYear);

      const approvalOk =
        !filters.approvalStatus ||
        (s.approvalStatus || "Pending") === filters.approvalStatus;

      return nameOk && genderOk && currOk && yearOk && approvalOk;
    });
  }, [bundle, filters]);

  if (loading && !bundle) return <p style={{ padding: 20 }}>Loading...</p>;
  if (!bundle) return <p style={{ padding: 20 }}>No data</p>;

  const { institution, admins, stats, students, feesSummary, documents, activity } = bundle;

  return (
    <div className="admin-layout-wrapper">
      <AdminSidebar />

      <main className="admin-main-content">
        <div className="school-profile-top">
          <div>
            <h2>🏫 {institution?.name}</h2>
            <p className="sub">
              Admins: <b>{admins?.length || 0}</b> • Students: <b>{students?.length || 0}</b>
            </p>
          </div>

          <button className="refresh-btn" onClick={load}>
            ↻ Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")}>
            Overview
          </button>
          <button className={tab === "students" ? "active" : ""} onClick={() => setTab("students")}>
            Students
          </button>
          <button className={tab === "fees" ? "active" : ""} onClick={() => setTab("fees")}>
            Fees Summary
          </button>
          <button className={tab === "documents" ? "active" : ""} onClick={() => setTab("documents")}>
            Documents
          </button>
          <button className={tab === "activity" ? "active" : ""} onClick={() => setTab("activity")}>
            Activity
          </button>
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div className="card">
            <div className="grid-3">
              <div className="info">
                <span>Total Students</span>
                <b>{stats?.totalStudents || 0}</b>
              </div>
              <div className="info">
                <span>Approved</span>
                <b>{stats?.approvedStudents || 0}</b>
              </div>
              <div className="info">
                <span>Pending</span>
                <b>{stats?.pendingStudents || 0}</b>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <h4>High School Admin Accounts</h4>
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((a) => (
                      <tr key={a._id}>
                        <td>{a.user?.fullName}</td>
                        <td>{a.user?.email}</td>
                        <td>{a.role}</td>
                        <td>
                          <span className={a.isActive ? "badge badge-active" : "badge badge-inactive"}>
                            {a.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!admins.length && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center" }}>
                          No admins found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Students tab */}
        {tab === "students" && (
          <div className="card">
            <div className="card-head">
              <h3>👨‍🎓 Students</h3>

              <div className="filters-bar">
                <input
                  placeholder="Search name..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />

                <select value={filters.gender} onChange={(e) => setFilters({ ...filters, gender: e.target.value })}>
                  <option value="">Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>

                <select
                  value={filters.curriculum}
                  onChange={(e) => setFilters({ ...filters, curriculum: e.target.value })}
                >
                  <option value="">System</option>
                  <option value="CBC">CBC</option>
                  <option value="844">8-4-4</option>
                </select>

                <input
                  placeholder="Year"
                  value={filters.academicYear}
                  onChange={(e) => setFilters({ ...filters, academicYear: e.target.value })}
                />

                <select
                  value={filters.approvalStatus}
                  onChange={(e) => setFilters({ ...filters, approvalStatus: e.target.value })}
                >
                  <option value="">Approval</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>RegNo</th>
                    <th>Gender</th>
                    <th>System</th>
                    <th>Level</th>
                    <th>Year</th>
                    <th>Approval</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => (
                    <tr key={s._id}>
                      <td>{s.fullName}</td>
                      <td>{s.registrationNo || "—"}</td>
                      <td>{s.gender}</td>
                      <td>{s.curriculum}</td>
                      <td>{s.level}</td>
                      <td>{s.academicYear}</td>
                      <td>
                        <span className={`status-pill ${s.approvalStatus || "Pending"}`}>
                          {s.approvalStatus || "Pending"}
                        </span>
                      </td>

                      <td className="actions-cell">
                        <button
                          className="profile-btn"
                          onClick={() => navigate(`/admin/students/${s._id}/profile`)}
                        >
                          View
                        </button>

                        <button className="approve-btn" onClick={() => approveReject(s._id, "Approved")}>
                          Approve
                        </button>

                        <button className="reject-btn" onClick={() => approveReject(s._id, "Rejected")}>
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!filteredStudents.length && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center" }}>
                        No students match filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Fees Summary */}
        {tab === "fees" && (
          <div className="card">
            <h3>💰 Fees Summary</h3>

            <div className="grid-3" style={{ marginTop: 10 }}>
              <div className="info">
                <span>Total Fees Expected</span>
                <b>KES {Number(feesSummary?.totalExpected || 0).toLocaleString()}</b>
              </div>
              <div className="info">
                <span>Total Paid</span>
                <b>KES {Number(feesSummary?.totalPaid || 0).toLocaleString()}</b>
              </div>
              <div className="info">
                <span>Total Balance</span>
                <b>KES {Number(feesSummary?.totalBalance || 0).toLocaleString()}</b>
              </div>
            </div>

            <div className="table-wrapper" style={{ marginTop: 12 }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Year</th>
                    <th>Term</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {(feesSummary?.records || []).map((r) => (
                    <tr key={r._id}>
                      <td>{r.studentName}</td>
                      <td>{r.academicYear}</td>
                      <td>{r.term}</td>
                      <td>KES {Number(r.totalFees || 0).toLocaleString()}</td>
                      <td>KES {Number(r.paidAmount || 0).toLocaleString()}</td>
                      <td>KES {Number((r.totalFees || 0) - (r.paidAmount || 0)).toLocaleString()}</td>
                    </tr>
                  ))}
                  {!feesSummary?.records?.length && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center" }}>
                        No fee records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Documents */}
        {tab === "documents" && (
          <div className="card">
            <h3>📎 Latest Documents</h3>

            <div className="table-wrapper" style={{ marginTop: 12 }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Open</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((d) => (
                    <tr key={d._id}>
                      <td>{d.studentName}</td>
                      <td>{d.title}</td>
                      <td>{d.type}</td>
                      <td>{new Date(d.createdAt).toLocaleDateString()}</td>
                      <td>
                        <a className="profile-btn" href={`${API_URL}${d.fileUrl}`} target="_blank" rel="noreferrer">
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                  {!documents.length && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center" }}>
                        No documents uploaded yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Activity */}
        {tab === "activity" && (
          <div className="card">
            <h3>🧾 Activity Log</h3>

            <div className="table-wrapper" style={{ marginTop: 12 }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Action</th>
                    <th>Actor</th>
                    <th>Target</th>
                    <th>Meta</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.map((x) => (
                    <tr key={x._id}>
                      <td>{new Date(x.createdAt).toLocaleString()}</td>
                      <td>{x.action}</td>
                      <td>{x.actorName}</td>
                      <td>{x.targetLabel}</td>
                      <td>{x.metaText || "—"}</td>
                    </tr>
                  ))}

                  {!activity.length && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center" }}>
                        No activity yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
