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

  // === ADDED ===
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState("");

  // === ADDED: Approve Handler ===
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

  // === ADDED: Reject Handler ===
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

  // Load student data
  useEffect(() => {
    (async function () {
      try {
        const res = await axios.get(`${API_URL}/api/admin/student/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(res.data);
      } catch (err) {
        console.error("STUDENT DETAIL ERROR:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [token, userId]);

  if (loading) return <div className="admin-content">Loading...</div>;

  const { user, profile, documents, performance } = data;

  const labels = performance.map(
    (p) => `${p.yearOfStudy} • ${p.academicPeriod}`
  );

  const gpaValues = performance.map((p) =>
    typeof p.gpa === "number" ? p.gpa : null
  );

  const chartData = {
    labels,
    datasets: [
      {
        label: "GPA",
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

  const options = {
    scales: {
      y: { suggestedMin: 0, suggestedMax: 5, title: { display: true, text: "GPA (0–5)" } },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const row = performance[ctx.dataIndex];
            if (row.status === "pending") return "Pending transcript";
            if (row.rawAverage) return `Avg: ${row.rawAverage}% → GPA ${ctx.parsed.y}`;
            if (row.meanGrade) return `Grade: ${row.meanGrade} → GPA ${ctx.parsed.y}`;
            return `GPA: ${ctx.parsed.y}`;
          },
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
              <div><strong>Name:</strong> {user?.fullName}</div>
              <div><strong>Email:</strong> {user?.email}</div>
              <div><strong>Admission No:</strong> {profile?.admissionNo}</div>
              <div><strong>Course:</strong> {profile?.course}</div>
              <div><strong>Year of Study:</strong> {profile?.year}</div>
              <div><strong>Institution:</strong> {profile?.institution}</div>
            </div>
          </div>
        </div>

        {/* PERFORMANCE GRAPH */}
        <h3 className="section-title">📊 Performance</h3>
        <div className="admin-chart-wrap">
          <Line data={chartData} options={options} />
        </div>

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

        {/* === ADDED — APPROVAL BUTTONS === */}
        <div className="approval-actions">
          <button className="approve-btn" onClick={handleApprove}>
            Approve Profile
          </button>
          <button className="reject-btn" onClick={() => setRejectModal(true)}>
            Reject Profile
          </button>
        </div>

        {/* === ADDED — REJECTION MODAL === */}
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
      </main>
    </div>
  );
}
