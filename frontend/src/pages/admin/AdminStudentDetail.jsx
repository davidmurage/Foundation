// src/pages/admin/AdminStudentDetail.jsx
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

import "../../styles/admin/AdminStudentDetail.css";
import "../../styles/admin/AdminLayoutBase.css";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
);

export default function AdminStudentDetail() {
  const token = localStorage.getItem("token");
  const { userId } = useParams();

  /* ================= STATE ================= */
  const [data, setData] = useState({
    user: null,
    profile: null,
    documents: [],
    performance: [],
  });

  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState("overview");

  // Profile approval
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState("");

  // Fee rejection
  const [feeRejectModal, setFeeRejectModal] = useState(false);
  const [feeRejectReason, setFeeRejectReason] = useState("");
  const [feeToActOn, setFeeToActOn] = useState(null);

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const studentRes = await axios.get(
          `${API_URL}/api/admin/student/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setData(studentRes.data);
      } catch (err) {
        console.error("STUDENT FETCH ERROR:", err);
      }

      try {
        const feesRes = await axios.get(
          `${API_URL}/api/admin/fees/student/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFees(Array.isArray(feesRes.data) ? feesRes.data : []);
      } catch (err) {
        console.warn("FEES FETCH ERROR:", err);
        setFees([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [token, userId]);

  /* ================= PROFILE ACTIONS ================= */
  const handleApprove = async () => {
    try {
      await axios.put(
        `${API_URL}/api/student/${userId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Profile approved successfully.");
    } catch {
      alert("Error approving profile");
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectionMessage.trim()) {
      alert("Please enter a rejection reason.");
      return;
    }

    try {
      await axios.put(
        `${API_URL}/api/student/${userId}/reject`,
        { message: rejectionMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Profile rejected successfully.");
      setRejectModal(false);
      setRejectionMessage("");
    } catch {
      alert("Error rejecting profile");
    }
  };

  /* ================= FEE ACTIONS ================= */
  const updateFee = async (feeId, payload) => {
    try {
      await axios.put(
        `${API_URL}/api/admin/fees/${feeId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFees((prev) =>
        prev.map((f) => (f._id === feeId ? { ...f, ...payload } : f))
      );
    } catch {
      alert("Failed to update fee");
    }
  };

  const submitFeeRejection = async () => {
    await axios.put(
      `${API_URL}/api/admin/fees/${feeToActOn}/reject`,
      { reason: feeRejectReason },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setFees((prev) =>
      prev.map((f) =>
        f._id === feeToActOn
          ? { ...f, reviewStatus: "rejected", adminFeedback: feeRejectReason }
          : f
      )
    );

    setFeeRejectModal(false);
    setFeeRejectReason("");
  };

  if (loading) return <div className="admin-content">Loading...</div>;

  const { user, profile, documents, performance } = data;

  /* ================= CHART ================= */
  const chartData = {
    labels: performance.map(
      (p) => `${p.yearOfStudy} • ${p.academicPeriod}`
    ),
    datasets: [
      {
        label: "GPA",
        data: performance.map((p) =>
          typeof p.gpa === "number" ? p.gpa : null
        ),
        borderColor: "#009639",
        backgroundColor: "rgba(0,150,57,0.25)",
        tension: 0.3,
        spanGaps: true,
      },
    ],
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-content">
        <h2>👤 Student Profile</h2>

        {/* ================= TABS ================= */}
        <div className="admin-tabs">
          {["overview", "fees", "documents", "approval"].map(
            (t) => (
              <button
                key={t}
                className={activeTab === t ? "active" : ""}
                onClick={() => setActiveTab(t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            )
          )}
        </div>

        {/* ================= OVERVIEW ================= */}
        {activeTab === "overview" && (
          <div className="admin-student-card">
            {profile?.photo ? (
              <img src={profile.photo} className="profile-avatar" />
            ) : (
              <div className="profile-avatar placeholder" />
            )}

            <div className="grid">
              <div><strong>Name:</strong> {user?.fullName}</div>
              <div><strong>Email:</strong> {user?.email}</div>
              <div><strong>Admission:</strong> {profile?.admissionNo}</div>
              <div><strong>Course:</strong> {profile?.course}</div>
              <div><strong>Year:</strong> {profile?.year}</div>
              <div><strong>Institution:</strong> {profile?.institutionName}</div>
            </div>
          </div>
        )}

        {/* ================= FEES ================= */}
        
{activeTab === "fees" && (
  <div className="admin-table-wrap">
    <table className="admin-table">
      <thead>
        <tr>
          <th>Year</th>
          <th>Period</th>
          <th>Start Date</th>
          <th>End Date</th>
          <th>Amount</th>
          <th>Review</th>
          <th>Processing</th>
          <th>Documents</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {fees.map((f) => (
          <tr key={f._id}>
            <td>{f.academicYear}</td>
            <td>{f.academicPeriod}</td>
            <td>
                   {f.periodStart
                    ? new Date(f.periodStart).toLocaleDateString()
                    : "—"}
                </td>

                <td>
                   {f.periodEnd
                    ? new Date(f.periodEnd).toLocaleDateString()
                    : "—"}
                </td>
            <td>{Number(f.amountRequested).toLocaleString()}</td>

            {/* REVIEW STATUS */}
            <td>
              <span className={`badge ${f.reviewStatus}`}>
                {f.reviewStatus}
              </span>
            </td>

            {/* PROCESSING STATUS */}
            <td>
              <select
                className={`status-select ${f.processingStatus}`}
                value={f.processingStatus}
                onChange={(e) =>
                  updateFee(f._id, {
                    processingStatus: e.target.value,
                  })
                }
              >
                <option value="processing">Processing</option>
                <option value="approved">Approved</option>
                <option value="disbursed">Disbursed</option>
                <option value="paid">Paid</option>
              </select>

              {f.adminFeedback && (
                <div className="admin-feedback">
                  <b>Admin:</b> {f.adminFeedback}
                </div>
              )}
            </td>

            {/* DOCUMENTS */}
            <td>
              {Array.isArray(f.documents) && f.documents.length > 0 ? (
                <div className="doc-links">
                  {f.documents.map((d, i) => (
                    <a
                      key={i}
                      href={`${API_URL}${d.fileUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="doc-link"
                    >
                      📄 {d.label}
                    </a>
                  ))}
                </div>
              ) : (
                <span className="muted">No docs</span>
              )}
            </td>

            {/* ACTIONS */}
            <td>
              {f.reviewStatus === "pending" ? (
                <div className="table-actions">
                  <button
                    className="approve-btn small"
                    onClick={() =>
                      updateFee(f._id, {
                        reviewStatus: "approved",
                        processingStatus: "approved",
                      })
                    }
                  >
                    Approve
                  </button>

                  <button
                    className="reject-btn small"
                    onClick={() => {
                      setFeeToActOn(f._id);
                      setFeeRejectModal(true);
                    }}
                  >
                    Reject
                  </button>
                </div>
              ) : (
                <span className="muted">—</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}


        {/* ================= PERFORMANCE ================= 
        {activeTab === "performance" && (
          <div className="admin-chart-wrap">
            <Line data={chartData} />
          </div>
        )}*/}

        {/* ================= DOCUMENTS ================= */}
        {activeTab === "documents" && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>File</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((d) => (
                  <tr key={d._id}>
                    <td>{new Date(d.createdAt).toLocaleDateString()}</td>
                    <td>{d.documentType}</td>
                    <td>
                      <a href={`${API_URL}${d.fileUrl}`} target="_blank" rel="noreferrer">
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= APPROVAL ================= */}
        {activeTab === "approval" && (
          <div className="approval-actions">
            <button className="approve-btn" onClick={handleApprove}>
              Approve Profile
            </button>
            <button className="reject-btn" onClick={() => setRejectModal(true)}>
              Reject Profile
            </button>
          </div>
        )}

        {/* ================= MODALS ================= */}
        {rejectModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Reject Profile</h3>
              <textarea
                value={rejectionMessage}
                onChange={(e) => setRejectionMessage(e.target.value)}
              />
              <div className="modal-actions">
                <button className="save-btn" onClick={handleRejectSubmit}>
                  Submit
                </button>
                <button className="cancel-btn" onClick={() => setRejectModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {feeRejectModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Reject Fee</h3>
              <textarea
                value={feeRejectReason}
                onChange={(e) => setFeeRejectReason(e.target.value)}
              />
              <div className="modal-actions">
                <button className="save-btn" onClick={submitFeeRejection}>
                  Submit
                </button>
                <button
                  className="cancel-btn"
                  onClick={() => setFeeRejectModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
