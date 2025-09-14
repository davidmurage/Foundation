import React, { useEffect, useState } from "react";
import axios from "axios";
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
import "../../styles/Performance.css";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

export default function Performance() {
  const token = localStorage.getItem("token");
  const [rows, setRows] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/performance`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setRows(res.data))
      .catch((err) => console.error(err));
  }, [token]);

  const labels = rows.map((r) => `${r.yearOfStudy} • ${r.academicPeriod}`);
  const gpaData = rows.map((r) => (typeof r.gpa === "number" ? r.gpa : null));

  const data = {
    labels,
    datasets: [
      {
        label: "GPA",
        data: gpaData,
        borderColor: "#006400",
        backgroundColor: "rgba(0,150,57,0.3)",
        pointBackgroundColor: rows.map((r) => (r.status === "pending" ? "#999" : "#009639")),
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
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const row = rows[ctx.dataIndex];
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
    <div className="perf-container">
      <h2>📊 Performance</h2>
      <Line data={data} options={options} />

      <div className="perf-table">
        <table>
          <thead>
            <tr>
              <th>Year</th>
              <th>Period</th>
              <th>Status</th>
              <th>Average (%)</th>
              <th>Mean Grade</th>
              <th>GPA</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.yearOfStudy}</td>
                <td>{r.academicPeriod}</td>
                <td>{r.status}</td>
                <td>{r.rawAverage ?? "-"}</td>
                <td>{r.meanGrade ?? "-"}</td>
                <td>{r.gpa ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
