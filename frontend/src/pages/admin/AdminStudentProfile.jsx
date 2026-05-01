import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../utils/config";

import AdminSidebar from "../../components/admin/AdminSidebar";
import "../../styles/admin/AdminLayoutBase.css";
//import "../../styles/admin/AdminStudentProfile.css";

export default function AdminStudentProfile() {
  const { studentId } = useParams();
  const token = localStorage.getItem("token");

  const [bundle, setBundle] = useState(null);
  const [tab, setTab] = useState("overview");

  const navigate = useNavigate();

  const load = async () => {
    const res = await axios.get(`${API_URL}/api/highschools/students/${studentId}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setBundle(res.data);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [studentId]);

  if (!bundle) return <p style={{ padding: 20 }}>Loading student profile...</p>;

  const { student, performance, feeRecords, documents } = bundle;

  return (
    <div className="admin-layout-wrapper">
      <AdminSidebar />

      <main className="admin-main-content">
        <div className="student-top">
          <button
              className="back-btn"
              onClick={() => navigate(-1)}
            >
               ← Back
            </button>
          <div>
            <h2>👨‍🎓 {student.fullName}</h2>
            <p className="sub">
              RegNo: <b>{student.registrationNo || "—"}</b> • System: <b>{student.curriculum}</b> • Level:{" "}
              <b>{student.level}</b>
            </p>
          </div>

          {/*<span className={`status-pill ${student.sponsorshipStatus || "Pending"}`}>
            {student.sponsorshipStatus || "Pending"}
          </span>*/}
        </div>

        <div className="tabs">
          <button className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")}>
            Overview
          </button>
          <button className={tab === "performance" ? "active" : ""} onClick={() => setTab("performance")}>
            Performance
          </button>
          <button className={tab === "fees" ? "active" : ""} onClick={() => setTab("fees")}>
            Fees
          </button>
          <button className={tab === "documents" ? "active" : ""} onClick={() => setTab("documents")}>
            Attachments
          </button>
        </div>

        {tab === "overview" && (
          <div className="card">
            <div className="grid-2">
              <div className="info">
                <span>Gender</span>
                <b>{student.gender}</b>
              </div>
              <div className="info">
                <span>Year of admission</span>
                <b>{student.academicYear}</b>
              </div>
              <div className="info">
                <span>Term</span>
                <b>{student.term}</b>
              </div>
              {/*<div className="info">
                <span>Fees Amount</span>
                <b>KES {Number(student.feesAmount || 0).toLocaleString()}</b>
              </div>*/}
            </div>
          </div>
        )}

        {tab === "performance" && (
          <div className="card">
            <h3>📊 Performance</h3>
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Term</th>
                    <th>Assessment</th>
                    <th>Details</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.map((p) => (
                    <tr key={p._id}>
                      <td>{p.academicYear}</td>
                      <td>{p.term}</td>
                      <td>{p.examName}</td>
                      <td>
                        {p.curriculum === "CBC" ? (
                          <>
                            <b>{p.learningArea}</b>
                            <div className="cbc-badge">{p.competencyLevel}</div>
                          </>
                        ) : (
                          <>
                            Score: <b>{p.meanScore}</b> | Grade: <b>{p.meanGrade}</b>
                          </>
                        )}
                      </td>
                      <td>{p.remarks || "—"}</td>
                    </tr>
                  ))}
                  {!performance.length && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center" }}>
                        No performance records
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "fees" && (
          <div className="card">
            <h3>💰 Fees</h3>
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Term</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {feeRecords.map((f) => (
                    <tr key={f._id}>
                      <td>{f.academicYear}</td>
                      <td>{f.term}</td>
                      <td>KES {Number(f.totalFees || 0).toLocaleString()}</td>
                      <td>KES {Number(f.paidAmount || 0).toLocaleString()}</td>
                      <td>KES {Number((f.totalFees || 0) - (f.paidAmount || 0)).toLocaleString()}</td>
                      <td>
                       {(() => {
                         const total = Number(f.totalFees || 0);
                         const paid = Number(f.paidAmount || 0);

                         let status = "Unpaid";

                         if (paid > 0 && paid < total) status = "Partial";
                         if (paid >= total && total > 0) status = "Paid";

                         return (
                         <span className={`status-pill ${status.toLowerCase()}`}>
                          {status}
                         </span>
                          );
                        })()}
                      </td>
                    </tr>
                  ))}
                  {!feeRecords.length && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center" }}>
                        No fee records
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "documents" && (
          <div className="card">
            <h3>📎 Attachments</h3>
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Open</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((d) => (
                    <tr key={d._id}>
                      <td>{d.title || d.originalName}</td>
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
                      <td colSpan={4} style={{ textAlign: "center" }}>
                        No documents uploaded
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
