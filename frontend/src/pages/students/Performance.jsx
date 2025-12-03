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

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
);

export default function Performance() {
  const token = localStorage.getItem("token");

  const [rows, setRows] = useState([]);
  const [yearly, setYearly] = useState([]);

  /* -----------------------------
      LOAD SEMESTER / TERM DATA
  ------------------------------*/
  useEffect(() => {
    axios
      .get(`${API_URL}/api/performance`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (Array.isArray(res.data)) setRows(res.data);
        else setRows([]);
      })
      .catch((err) => console.error("PERFORMANCE ERROR:", err));
  }, [token]);

  /* -----------------------------
      LOAD YEARLY TREND
  ------------------------------*/
  useEffect(() => {
    axios
      .get(`${API_URL}/api/performance/yearly`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (Array.isArray(res.data)) setYearly(res.data);
        else setYearly([]);
      })
      .catch((err) => console.error("YEARLY ERROR:", err));
  }, [token]);

  /* -----------------------------
      SEMESTER CHART
  ------------------------------*/
  const semLabels = rows.map(
    (r) => `${r.yearOfStudy} • ${r.academicPeriod}`
  );

  const semGpa = rows.map((r) =>
    typeof r.gpa === "number" ? r.gpa : null
  );

  const semesterChart = {
    labels: semLabels,
    datasets: [
      {
        label: "GPA Trend",
        data: semGpa,
        borderColor: "#009639",
        backgroundColor: "rgba(0,150,57,0.25)",
        pointBackgroundColor: rows.map((r) =>
          r.status === "pending" ? "#888" : "#009639"
        ),
        tension: 0.3,
        spanGaps: true,
      },
    ],
  };

  const semesterOptions = {
    scales: {
      y: {
        suggestedMin: 0,
        suggestedMax: 5,
        title: { display: true, text: "GPA (0–5)" },
      },
    },
  };

  /* -----------------------------
      YEARLY TREND CHART
  ------------------------------*/
  const yearlyChart = {
    labels: yearly.map((y) => `Year ${y.year}`),
    datasets: [
      {
        label: "Yearly GPA",
        data: yearly.map((y) => y.avgGpa),
        borderColor: "#0077cc",
        backgroundColor: "rgba(0,119,204,0.25)",
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="perf-container">
      <h2>📊 Performance Overview</h2>

      {/* SEMESTER GRAPH */}
      <h3>Semester / Term Performance</h3>
      <Line data={semesterChart} options={semesterOptions} />

      {/* SEMESTER TABLE */}
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

      {/* YEARLY TREND */}
      <h3 style={{ marginTop: "40px" }}>📈 Yearly GPA Trend</h3>
      <Line data={yearlyChart} />

      {/* YEARLY TABLE */}
      <div className="perf-table" style={{ marginTop: "20px" }}>
        <table>
          <thead>
            <tr>
              <th>Year</th>
              <th>Avg GPA</th>
              <th>Change</th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody>
            {yearly.map((y, i) => (
              <tr key={i}>
                <td>{y.year}</td>
                <td>{y.avgGpa}</td>
                <td>{y.change ?? "-"}</td>
                <td>
                  {y.direction === "up" && "⬆ Improvement"}
                  {y.direction === "down" && "⬇ Drop"}
                  {y.direction === "same" && "— Same"}
                  {y.direction === null && "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
