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
                <strong>Institution:</strong> {profile?.institution}
              </div>
            </div>
          </div>
        </div>

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
      </main>
    </div>
  );
}
