import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../utils/config";
import "../../styles/student/FeesApplication.css";

export default function FeesApplication() {
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);

  const [editModal, setEditModal] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [editForm, setEditForm] = useState({});

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
    institutionType: "",
    institutionId: "",
  });

  /* ================= LOAD PROFILE ================= */
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

  /* ================= LOAD APPLICATIONS ================= */
  const loadApps = async () => {
    setLoading(true);
    const res = await axios.get(`${API_URL}/api/fees`, { headers });
    setApps(res.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadApps();
    // eslint-disable-next-line
  }, []);

  /* ================= SUBMIT APPLICATION ================= */
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

      if (form.feeStructure) fd.append("feeStructure", form.feeStructure);
      if (form.feeStatement) fd.append("feeStatement", form.feeStatement);
      if (form.otherDocs?.length) {
        form.otherDocs.forEach((f) => fd.append("otherDocs", f));
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
      alert(err.response?.data?.message || "Submission failed");
    }
  };

  /* ================= RESUBMIT ================= */
  const resubmit = async (id) => {
    try {
      await axios.put(`${API_URL}/api/fees/${id}/resubmit`, {}, { headers });
      alert("Application resubmitted");
      loadApps();
    } catch (err) {
      alert(err.response?.data?.message || "Resubmission failed");
    }
  };

  const submitEditAndResubmit = async () => {
  try {
    const fd = new FormData();

    fd.append("academicYear", editForm.academicYear);
    fd.append("yearOfStudy", editForm.yearOfStudy);
    fd.append("academicPeriod", editForm.academicPeriod);
    fd.append("amountRequested", editForm.amountRequested);

    if (editForm.feeStructure)
      fd.append("feeStructure", editForm.feeStructure);

    if (editForm.feeStatement)
      fd.append("feeStatement", editForm.feeStatement);

    if (editForm.otherDocs?.length) {
      editForm.otherDocs.forEach((f) => fd.append("otherDocs", f));
    }

    await axios.put(
      `${API_URL}/api/fees/${editingApp._id}/update`,
      fd,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    alert("Application corrected and resubmitted");
    setEditModal(false);
    loadApps();
  } catch (err) {
    alert(err.response?.data?.message || "Update failed");
  }
};



  return (
    <div className="dashboard-container">
      <h2>💰 Fees Application</h2>

      {/* ================= APPLY FORM ================= */}
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
          {[1, 2, 3, 4, 5].map((y) => (
            <option key={y} value={y}>
              Year {y}
            </option>
          ))}
        </select>

        {/* Academic Period */}
        <select
          value={form.academicPeriod}
          onChange={(e) =>
            setForm({ ...form, academicPeriod: e.target.value })
          }
        >
          <option value="">Select Period</option>

          {form.institutionType === "University" && (
            <>
              <option value="Semester 1">Semester 1</option>
              <option value="Semester 2">Semester 2</option>
              <option value="Semester 3">Semester 3</option>
            </>
          )}

          {form.institutionType === "TVET" && (
            <>
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </>
          )}
        </select>

        <label>Start date</label>
        <input
          type="date"
          onChange={(e) =>
            setForm({ ...form, periodStart: e.target.value })
          }
        />

        <label>End date</label>
        <input
          type="date"
          onChange={(e) => setForm({ ...form, periodEnd: e.target.value })}
        />

        <input
          type="number"
          placeholder="Amount (KES)"
          onChange={(e) =>
            setForm({ ...form, amountRequested: e.target.value })
          }
        />

        <label>Fee Structure</label>
        <input
          type="file"
          onChange={(e) =>
            setForm({ ...form, feeStructure: e.target.files[0] })
          }
        />

        <label>Fee Statement</label>
        <input
          type="file"
          onChange={(e) =>
            setForm({ ...form, feeStatement: e.target.files[0] })
          }
        />

        <label>Other Supporting Documents</label>
        <input
          type="file"
          multiple
          onChange={(e) =>
            setForm({ ...form, otherDocs: [...e.target.files] })
          }
        />

        <button onClick={submit}>Submit Application</button>
      </div>

      {/* ================= APPLICATIONS ================= */}
      <h3>My Applications</h3>
      {loading && <p>Loading...</p>}

      {/* ================= DESKTOP TABLE ================= */}
      <div className="table-wrapper">
        <table className="fees-table">
          <thead>
            <tr>
              <th>Academic Year</th>
              <th>Period</th>
              <th>Amount</th>
              <th>Review</th>
              <th>Processing</th>
              <th>Documents</th>
              <th>Admin Feedback</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {apps.map((a) => (
              <tr key={a._id}>
                <td>{a.academicYear}</td>
                <td>{a.academicPeriod}</td>
                <td>{Number(a.amountRequested).toLocaleString()}</td>
                <td>
                  <span className={`status ${a.reviewStatus}`}>
                   {a.reviewStatus}
                  </span>
                </td>

                 <td>
                   <span className={`process ${a.processingStatus}`}>
                   {a.processingStatus}
                   </span>
                </td>


                <td>
                  {a.documents.map((d, i) => (
                    <a key={i} href={d.fileUrl} target="_blank" rel="noreferrer">
                      {d.label}
                    </a>
                  ))}
                </td>

                <td>
                  {a.reviewStatus === "rejected" && a.adminFeedback ? (
                    <div className="admin-feedback">
                      ❗ <b>Admin:</b> {a.adminFeedback}
                    </div>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>

                <td>
                  {a.reviewStatus === "rejected" && (
                    <button
                     className="resubmit-btn"
                    onClick={() => {
                    setEditingApp(a);
                    setEditForm({
                     academicYear: a.academicYear,
                     yearOfStudy: a.yearOfStudy,
                     academicPeriod: a.academicPeriod,
                     amountRequested: a.amountRequested,
                     feeStructure: null,
                     feeStatement: null,
                     otherDocs: [],
                    });
                    setEditModal(true);
                  }}
                    >
                     ✏️ Edit & Resubmit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= MOBILE CARDS ================= */}
      <div className="fees-cards">
        {apps.map((a) => (
          <div key={a._id} className="fees-card">
            <strong>{a.academicYear}</strong>
            <p>{a.academicPeriod}</p>
            <p>KES {Number(a.amountRequested).toLocaleString()}</p>
            <p>Status: {a.reviewStatus}</p>

            {a.reviewStatus === "rejected" && a.adminFeedback && (
              <div className="admin-feedback">
                ❗ <b>Admin:</b> {a.adminFeedback}
              </div>
            )}

            {a.reviewStatus === "rejected" && (
              <button
                className="resubmit-btn"
                onClick={() => resubmit(a._id)}
              >
                🔁 Resubmit Application
              </button>
            )}
          </div>
        ))}
      </div>
      {editModal && (
  <div className="fee-modal-overlay">
    <div className="fee-modal" >
      <h3>✏️ Edit Fee Application</h3>
    
    <div className="fee-modal-content">
      <div className="admin-feedback">
        ❗ <b>Admin Feedback:</b> {editingApp.adminFeedback}
      </div>

      <input
        value={editForm.academicYear}
        onChange={(e) =>
          setEditForm({ ...editForm, academicYear: e.target.value })
        }
        placeholder="Academic Year"
      />

      <select
        value={editForm.yearOfStudy}
        onChange={(e) =>
          setEditForm({ ...editForm, yearOfStudy: e.target.value })
        }
      >
        {[1, 2, 3, 4, 5].map((y) => (
          <option key={y} value={y}>
            Year {y}
          </option>
        ))}
      </select>

      <select
        value={editForm.academicPeriod}
        onChange={(e) =>
          setEditForm({ ...editForm, academicPeriod: e.target.value })
        }
      >
        {form.institutionType === "University" ? (
          <>
            <option>Semester 1</option>
            <option>Semester 2</option>
            <option>Semester 3</option>
          </>
        ) : (
          <>
            <option>Term 1</option>
            <option>Term 2</option>
            <option>Term 3</option>
          </>
        )}
      </select>

      <input
        type="number"
        value={editForm.amountRequested}
        onChange={(e) =>
          setEditForm({ ...editForm, amountRequested: e.target.value })
        }
        placeholder="Amount"
      />

      <label>Replace Fee Structure</label>
      <input
        type="file"
        onChange={(e) =>
          setEditForm({ ...editForm, feeStructure: e.target.files[0] })
        }
      />

      <label>Replace Fee Statement</label>
      <input
        type="file"
        onChange={(e) =>
          setEditForm({ ...editForm, feeStatement: e.target.files[0] })
        }
      />

      <label>Other Supporting Docs</label>
      <input
        type="file"
        multiple
        onChange={(e) =>
          setEditForm({ ...editForm, otherDocs: [...e.target.files] })
        }
      />

      <div className="fee-modal-actions">
        <button className="save-btn" onClick={submitEditAndResubmit}>
          Save & Resubmit
        </button>
        <button className="cancel-btn" onClick={() => setEditModal(false)}>
          Cancel
        </button>
      </div>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
