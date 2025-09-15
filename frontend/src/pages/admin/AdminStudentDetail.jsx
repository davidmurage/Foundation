import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { API_URL } from "../../utils/config";
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

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

export default function AdminStudentDetail() {
  const token = localStorage.getItem("token");
  const { userId } = useParams();
  const [data, setData] = useState({ user: null, profile: null, documents: [], performance: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async function run() {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/admin/student/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [token, userId]);

  if (loading) return <p>Loading...</p>;
  const { user, profile, documents, performance } = data;

  const labels = performance.map(p => `${p.yearOfStudy} • ${p.academicPeriod}`);
  const gpas = performance.map(p => (typeof p.gpa === "number" ? p.gpa : null));
  const chartData = {
    labels,
    datasets: [
      {
        label: "GPA",
        data: gpas,
        borderColor: "#006400",
        backgroundColor: "rgba(0,150,57,0.25)",
        pointBackgroundColor: performance.map(p => p.status === "pending" ? "#999" : "#009639"),
        spanGaps: true,
        tension: 0.3,
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
    <div>
      <h2>👤 Student Profile</h2>

      <div className="admin-student-card">
        <div className="left">
          {profile?.photo ? <img src={profile.photo} alt="" className="profile-avatar" /> : <div className="profile-avatar placeholder" />}
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

      <h3 style={{marginTop: 24}}>📊 Performance</h3>
      <div className="admin-chart-wrap">
        <Line data={chartData} options={options} />
      </div>

      <h3 style={{marginTop: 24}}>📄 Documents</h3>
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
            {documents.map(d => (
              <tr key={d._id}>
                <td>{new Date(d.createdAt).toLocaleDateString()}</td>
                <td>{d.yearOfStudy}</td>
                <td>{d.academicPeriod}</td>
                <td>{d.documentType}</td>
                <td>
                  <a href={d.fileUrl} target="_blank" rel="noreferrer" className="btn-link">View</a>
                </td>
              </tr>
            ))}
            {!documents.length && (
              <tr><td colSpan={5} style={{textAlign:"center"}}>No documents</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
