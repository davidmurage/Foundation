// src/pages/admin/AdminStudentDetail.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { API_URL } from "../../utils/config";

import AdminSidebar from "../../components/admin/AdminSidebar";

// ChartJS
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

  const [data, setData] = useState({
    user: null,
    profile: null,
    documents: [],
    performance: [],
  });

  const [loading, setLoading] = useState(true);

  // Reject modal
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState("");

  // Fees
  const [fees, setFees] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);

  const [feeRejectModal, setFeeRejectModal] = useState(false);
  const [feeRejectReason, setFeeRejectReason] = useState("");
  const [feeToActOn, setFeeToActOn] = useState(null);

  const [paidModal, setPaidModal] = useState(false);
  const [disbursementRef, setDisbursementRef] = useState("");


  // Approve profile
  const handleApprove = async () => {
    try {
      await axios.put(
        `${API_URL}/api/student/${userId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Profile approved successfully.");
    } catch (err) {
      console.error(err);
      alert("Error approving profile");
    }
  };

  // Reject profile
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
    } catch (err) {
      console.error(err);
      alert("Error rejecting profile");
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

const submitPaid = async () => {
  await axios.put(
    `${API_URL}/api/admin/fees/${feeToActOn}/mark-paid`,
    { disbursementRef },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  setFees((prev) =>
    prev.map((f) =>
      f._id === feeToActOn
        ? {
            ...f,
            processingStatus: "paid",
            disbursementRef,
            paidDate: new Date(),
          }
        : f
    )
  );

  setPaidModal(false);
  setDisbursementRef("");
};


  /* =========================
     FETCH DATA (SAFE)
  ========================== */
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

  /* =========================
     UPDATE FEE
  ========================== */
  const updateFee = async (feeId, payload) => {
    try {
      await axios.put(
        `${API_URL}/api/admin/fees/${feeId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFees((prev) =>
        prev.map((f) =>
          f._id === feeId ? { ...f, ...payload } : f
        )
      );
    } catch (err) {
      console.error("UPDATE FEE ERROR:", err);
      alert("Failed to update fee application");
    }
  };

  if (loading) return <div className="admin-content">Loading...</div>;

  const { user, profile, documents, performance } = data;

  /* -----------------------
     CHART 1: GPA BY PERIOD
  ------------------------ */
  const periodLabels = performance.map(
    (p) => `${p.yearOfStudy} • ${p.academicPeriod}`
  );

  const gpaValues = performance.map((p) =>
    typeof p.gpa === "number" ? p.gpa : null
  );

  const periodChartData = {
    labels: periodLabels,
    datasets: [
      {
        label: "GPA by Semester / Term",
        data: gpaValues,
        borderColor: "#009639",
        backgroundColor: "rgba(0,150,57,0.25)",
        pointBackgroundColor: performance.map((p) =>
          p.status === "pending" ? "#888" : "#009639"
        ),
        tension: 0.3,
        spanGaps: true,
      },
    ],
  };

  const periodChartOptions = {
    scales: {
      y: {
        suggestedMin: 0,
        suggestedMax: 5,
        title: { display: true, text: "GPA (0–5)" },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const row = performance[ctx.dataIndex];
            if (row.status === "pending") return "Pending transcript";
            if (row.rawAverage)
              return `Avg: ${row.rawAverage}% → GPA ${ctx.parsed.y}`;
            if (row.meanGrade)
              return `Grade: ${row.meanGrade} → GPA ${ctx.parsed.y}`;
            return `GPA: ${ctx.parsed.y}`;
          },
        },
      },
    },
  };

  /* -----------------------
     CHART 2: GPA BY YEAR
     (aggregate all periods
      in each yearOfStudy)
  ------------------------ */
  const yearStats = {};

  performance.forEach((p) => {
    if (typeof p.gpa === "number") {
      const yearKey = p.yearOfStudy || "Unknown";
      if (!yearStats[yearKey]) {
        yearStats[yearKey] = { sum: 0, count: 0 };
      }
      yearStats[yearKey].sum += p.gpa;
      yearStats[yearKey].count += 1;
    }
  });

  const sortedYears = Object.keys(yearStats).sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return String(a).localeCompare(String(b));
  });

  const yearLabels = sortedYears.map((y) => `Year ${y}`);
  const yearGpas = sortedYears.map((y) =>
    +(yearStats[y].sum / yearStats[y].count).toFixed(2)
  );

  const yearChartData = {
    labels: yearLabels,
    datasets: [
      {
        label: "Average GPA per Year",
        data: yearGpas,
        borderColor: "#004b23",
        backgroundColor: "rgba(0,75,35,0.2)",
        pointBackgroundColor: "#004b23",
        tension: 0.3,
      },
    ],
  };

  const yearChartOptions = {
    scales: {
      y: {
        suggestedMin: 0,
        suggestedMax: 5,
        title: { display: true, text: "Average GPA (0–5)" },
      },
      x: {
        title: { display: true, text: "Year of Study" },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `Year GPA: ${ctx.parsed.y}`,
        },
      },
    },
  };

  



  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-content">
        <h2>👤 Student Profile</h2>

        {/* PROFILE CARD */}
        <div className="admin-student-card">
          <div className="left">
            {profile?.photo ? (
              <img src={profile.photo} alt="" className="profile-avatar" />
            ) : (
              <div className="profile-avatar placeholder" />
            )}
          </div>

          <div className="right">
            <div className="grid">
              <div>
                <strong>Name:</strong> {user?.fullName}
              </div>
              <div>
                <strong>Email:</strong> {user?.email}
              </div>
              <div>
                <strong>Admission No:</strong> {profile?.admissionNo}
              </div>
              <div>
                <strong>Course:</strong> {profile?.course}
              </div>
              <div>
                <strong>Year of Study:</strong> {profile?.year}
              </div>

              <div>
                <strong>Academic Period:</strong>{profile?.academicPeriod}
              </div>

              <div>
                <strong>Institution:</strong> {profile?.institutionName}
              </div>
            </div>
          </div>
        </div>
{/* ================= FEES ================= */}
<h3 className="section-title">💰 Fees Applications</h3>

{!Array.isArray(fees) || fees.length === 0 ? (
  <p>No fees applications found.</p>
) : (
  <div className="admin-table-wrap">
    <table className="admin-table fees-table">
      <thead>
        <tr>
          <th>Academic Year</th>
          <th>Period</th>
          <th>Year</th>
          <th>Amount (KES)</th>
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
            <td>{f.yearOfStudy}</td>
            <td>{Number(f.amountRequested).toLocaleString()}</td>

            <td>
              <span className={`badge ${f.reviewStatus}`}>
                {f.reviewStatus}
              </span>
            </td>

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

  {/* Admin rejection feedback */}
  {f.adminFeedback && (
    <div className="admin-feedback">
      <b>Admin:</b> {f.adminFeedback}
    </div>
  )}

  {/* Paid info */}
  {f.processingStatus === "paid" && (
    <div className="paid-info">
      💸 Ref: {f.disbursementRef || "—"} <br />
      📅 {f.paidDate
        ? new Date(f.paidDate).toLocaleDateString()
        : "—"}
    </div>
  )}
</td>


            <td>
              {Array.isArray(f.documents) && f.documents.length > 0 ? (
                f.documents.map((d, i) => (
                  <button
                    key={i}
                    className="link-btn"
                    onClick={() => setPreviewDoc(d.fileUrl)}
                  >
                    📄 {d.label}
                  </button>
                ))
              ) : (
                <span className="muted">No docs</span>
              )}
            </td>

            <td>
  {f.reviewStatus === "pending" && (
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
  )}

  {f.reviewStatus !== "pending" && (
    <span className="muted">—</span>
  )}
</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}


        {/* PERFORMANCE GRAPH: BY SEMESTER / TERM */}
        <h3 className="section-title">📊 Performance by Semester / Term</h3>
        <div className="admin-chart-wrap">
          <Line data={periodChartData} options={periodChartOptions} />
        </div>

        {/* PERFORMANCE GRAPH: YEARLY TREND */}
        {yearLabels.length > 0 && (
          <>
            <h3 className="section-title">📈 Yearly GPA Trend</h3>
            <div className="admin-chart-wrap">
              <Line data={yearChartData} options={yearChartOptions} />
            </div>
          </>
        )}

        {/* DOCUMENTS TABLE */}
        <h3 className="section-title">📄 Documents</h3>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Uploaded</th>
                <th>Year</th>
                <th>Period</th>
                <th>Type</th>
                <th>File</th>
              </tr>
            </thead>

            <tbody>
              {documents.map((d) => (
                <tr key={d._id}>
                  <td>{new Date(d.createdAt).toLocaleDateString()}</td>
                  <td>{d.yearOfStudy}</td>
                  <td>{d.academicPeriod}</td>
                  <td>{d.documentType}</td>
                  <td>
                    <a
                      href={d.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-link"
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))}

              {!documents.length && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center" }}>
                    No documents found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PDF PREVIEW */}
        {previewDoc && (
          <div className="modal-overlay" onClick={() => setPreviewDoc(null)}>
            <div className="modal pdf-modal" onClick={(e) => e.stopPropagation()}>
              <iframe src={previewDoc} title="Document Preview" />
            </div>
          </div>
        )}

        {/* APPROVAL BUTTONS */}
        <div className="approval-actions">
          <button className="approve-btn" onClick={handleApprove}>
            Approve Profile
          </button>
          <button className="reject-btn" onClick={() => setRejectModal(true)}>
            Reject Profile
          </button>
        </div>

        {/* REJECTION MODAL */}
        {rejectModal && (
          <div className="modal-overlay">
            <div className="modal reject-modal">
              <h3>Reject Profile</h3>
              <p>Please explain why this profile is being rejected.</p>

              <textarea
                rows="5"
                value={rejectionMessage}
                onChange={(e) => setRejectionMessage(e.target.value)}
                placeholder="Describe the issue or corrections needed…"
              />

              <div className="modal-actions">
                <button className="save-btn" onClick={handleRejectSubmit}>
                  Submit Rejection
                </button>
                <button
                  className="cancel-btn"
                  onClick={() => setRejectModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= FEE REJECT MODAL ================= */}
{feeRejectModal && (
  <div className="modal-overlay">
    <div className="modal reject-modal">
      <h3>Reject Fee Application</h3>
      <p>Please provide a reason for rejecting this fee application.</p>

      <textarea
        rows="4"
        value={feeRejectReason}
        onChange={(e) => setFeeRejectReason(e.target.value)}
        placeholder="Enter rejection reason…"
      />

      <div className="modal-actions">
        <button
          className="save-btn"
          onClick={submitFeeRejection}
          disabled={!feeRejectReason.trim()}
        >
          Submit Rejection
        </button>

        <button
          className="cancel-btn"
          onClick={() => {
            setFeeRejectModal(false);
            setFeeRejectReason("");
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

{/* ================= MARK PAID MODAL ================= 
{paidModal && (
  <div className="modal-overlay">
    <div className="modal reject-modal">
      <h3>Mark Fee as Paid</h3>
      <p>Enter disbursement reference (MPESA / EFT / Cheque)</p>

      <input
        type="text"
        placeholder="Disbursement Reference"
        value={disbursementRef}
        onChange={(e) => setDisbursementRef(e.target.value)}
      />

      <div className="modal-actions">
        <button
          className="save-btn"
          onClick={submitPaid}
          disabled={!disbursementRef.trim()}
        >
          Confirm Paid
        </button>

        <button
          className="cancel-btn"
          onClick={() => {
            setPaidModal(false);
            setDisbursementRef("");
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}*/}

      </main>
    </div>
  );
}
