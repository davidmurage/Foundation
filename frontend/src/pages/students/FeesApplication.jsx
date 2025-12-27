import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../utils/config";
import "../../styles/student/FeesApplication.css";

export default function FeesApplication() {
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    academicYear: "",
    yearOfStudy: "",
    academicPeriod: "",
    periodStart: "",
    periodEnd: "",
    amountRequested: "",
    feeStructure: null,
    feeStatement: null,
    otherDocs: [],
  });

  /* LOAD PROFILE (institution info) */
  useEffect(() => {
    (async () => {
      const prof = await axios.get(`${API_URL}/api/student/profile`, { headers });
      if (prof.data) {
        setForm((f) => ({
          ...f,
          institutionType: prof.data.institutionType,
          institutionId: prof.data.institution,
        }));
      }
    })();
    // eslint-disable-next-line
  }, []);

  const loadApps = async () => {
    setLoading(true);
    const res = await axios.get(`${API_URL}/api/fees`, { headers });
    setApps(res.data || []);
    setLoading(false);
  };

  useEffect(() => { loadApps(); }, []);

  const submit = async () => {
  try {
    const fd = new FormData();

    fd.append("academicYear", form.academicYear);
    fd.append("yearOfStudy", form.yearOfStudy);
    fd.append("institutionId", form.institutionId);
    fd.append("academicPeriod", form.academicPeriod);
    fd.append("periodStart", form.periodStart);
    fd.append("periodEnd", form.periodEnd);
    fd.append("amountRequested", form.amountRequested);

    if (form.feeStructure) {
      fd.append("feeStructure", form.feeStructure);
    }

    if (form.feeStatement) {
      fd.append("feeStatement", form.feeStatement);
    }

    if (form.otherDocs?.length) {
      form.otherDocs.forEach((file) => {
        fd.append("otherDocs", file);
      });
    }

    await axios.post(`${API_URL}/api/fees`, fd, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    alert("Fees application submitted");
    loadApps();
  } catch (err) {
    console.error("FEES SUBMIT ERROR:", err.response?.data || err.message);
    alert(err.response?.data?.message || "Submission failed");
  }
};


  return (
    <div className="dashboard-container">
      <h2>💰 Fees Application</h2>

      <div className="card">
        <h3>Apply for Fees</h3>

        <input
          placeholder="Academic Year (e.g. 2025/2026)"
          value={form.academicYear}
          onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
        />

        <select
          value={form.yearOfStudy}
          onChange={(e) => setForm({ ...form, yearOfStudy: e.target.value })}
        >
          <option value="">Year of Study</option>
          {[1,2,3,4,5].map(y => (
            <option key={y} value={y}>Year {y}</option>
          ))}
        </select>

        <select
          value={form.academicPeriod}
          onChange={(e) => setForm({ ...form, academicPeriod: e.target.value })}
        >
          <option value="">Select Period</option>
          <option value="Semester 1">Semester 1</option>
          <option value="Semester 2">Semester 2</option>
          <option value="Semester 3">Semester 3</option>
        </select>

        <label>Start date</label>
        <input type="date" onChange={(e)=>setForm({...form,periodStart:e.target.value})} />

        <label>End date</label>
        <input type="date" onChange={(e)=>setForm({...form,periodEnd:e.target.value})} />

        <input
          type="number"
          placeholder="Amount (KES)"
          onChange={(e)=>setForm({...form,amountRequested:e.target.value})}
        />

        <h4>Required Documents</h4>

        <label>Fee Structure (PDF / Word)</label>
        <input type="file" accept=".pdf,.doc,.docx"
          onChange={(e)=>setForm({...form,feeStructure:e.target.files[0]})}
        />

        <label>Fee Statement (PDF / Word)</label>
        <input type="file" accept=".pdf,.doc,.docx"
          onChange={(e)=>setForm({...form,feeStatement:e.target.files[0]})}
        />

        <label>Other Supporting Documents</label>
        <input type="file" multiple accept=".pdf,.doc,.docx"
          onChange={(e)=>setForm({...form,otherDocs:[...e.target.files]})}
        />

        <button onClick={submit}>Submit Application</button>
      </div>

      <h3>My Applications</h3>
      {loading && <p>Loading...</p>}

      {apps.map((a) => (
        <div key={a._id} className="card">
          <strong>{a.academicYear} • {a.academicPeriod}</strong>
          <p>Amount: KES {a.amountRequested}</p>
          <p>Status: <b>{a.reviewStatus}</b> | <b>{a.processingStatus}</b></p>

          {a.documents.map((d, i) => (
            <p key={i}>
              📄 <a href={d.fileUrl} target="_blank" rel="noreferrer">{d.label}</a>
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}
