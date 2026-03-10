import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../utils/config";
import "../../styles/student/FeesApplication.css";
import ChatWidget from "../../components/ChatWidget";


export default function FeesApplication() {
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showApplyModal, setShowApplyModal] = useState(false);

  const [editModal, setEditModal] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [editForm, setEditForm] = useState({
    academicYear: "",
    yearOfStudy: "",
    academicPeriod: "",
    amountRequested: "",
    feeStructure: null,
    feeStatement: null,
    otherDocs: [],
  });

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
    try {
      const res = await axios.get(`${API_URL}/api/fees`, { headers });
      setApps(res.data || []);
    } catch (err) {
      console.error("LOAD FEES ERROR:", err);
      setApps([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApps();
    // eslint-disable-next-line
  }, []);

  /* ================= SUBMIT NEW APPLICATION ================= */
  const submit = async () => {
    try {
      const fd = new FormData();

      Object.entries({
        academicYear: form.academicYear,
        yearOfStudy: form.yearOfStudy,
        institutionId: form.institutionId,
        academicPeriod: form.academicPeriod,
        periodStart: form.periodStart,
        periodEnd: form.periodEnd,
        amountRequested: form.amountRequested,
      }).forEach(([k, v]) => fd.append(k, v));

      if (form.feeStructure) fd.append("feeStructure", form.feeStructure);
      if (form.feeStatement) fd.append("feeStatement", form.feeStatement);
      (form.otherDocs || []).forEach((f) => fd.append("otherDocs", f));

      await axios.post(`${API_URL}/api/fees`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Fees application submitted");

      // reset minimal fields (optional)
      setForm((prev) => ({
        ...prev,
        academicYear: "",
        yearOfStudy: "",
        academicPeriod: "",
        periodStart: "",
        periodEnd: "",
        amountRequested: "",
        feeStructure: null,
        feeStatement: null,
        otherDocs: [],
      }));

      setShowApplyModal(false);
      loadApps();
    } catch (err) {
      alert(err.response?.data?.message || "Submission failed");
    }
  };

  /* ================= DELETE (ONLY REJECTED) ================= */
  const deleteApplication = async (id) => {
    if (!window.confirm("Delete this rejected application permanently?")) return;

    try {
      await axios.delete(`${API_URL}/api/fees/${id}`, { headers });
      alert("Application deleted");
      loadApps();
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  /* ================= OPEN EDIT MODAL ================= */
  const openEditModal = (app) => {
    setEditingApp(app);
    setEditForm({
      academicYear: app.academicYear || "",
      yearOfStudy: app.yearOfStudy || "",
      academicPeriod: app.academicPeriod || "",
      amountRequested: app.amountRequested || "",
      feeStructure: null,
      feeStatement: null,
      otherDocs: [],
    });
    setEditModal(true);
  };

  /* ================= EDIT + RESUBMIT ================= */
  const submitEditAndResubmit = async () => {
    try {
      if (!editingApp?._id) return;

      const fd = new FormData();

      fd.append("academicYear", editForm.academicYear);
      fd.append("yearOfStudy", editForm.yearOfStudy);
      fd.append("academicPeriod", editForm.academicPeriod);
      fd.append("amountRequested", editForm.amountRequested);

      if (editForm.feeStructure) fd.append("feeStructure", editForm.feeStructure);
      if (editForm.feeStatement) fd.append("feeStatement", editForm.feeStatement);
      (editForm.otherDocs || []).forEach((f) => fd.append("otherDocs", f));

      await axios.put(`${API_URL}/api/fees/${editingApp._id}/update`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Application corrected and resubmitted");
      setEditModal(false);
      setEditingApp(null);
      loadApps();
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
    }
  };

  return (
    <div className="dashboard-container">
      <div className="fees-header">
        <h2>💰 Fees Applications</h2>
        <button className="apply-btn" onClick={() => setShowApplyModal(true)}>
          ➕ Apply New Fees
        </button>
      </div>

      {loading && <p>Loading...</p>}

      {/* ================= TABLE ================= */}
      <div className="table-wrapper">
        <table className="fees-table">
          <thead>
            <tr>
              <th>Academic Year</th>
              <th>Period</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Amount</th>
              <th>Review</th>
              <th>Processing</th>
              <th>Attachments</th>
              <th>Admin FeedBack</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {apps.map((a) => (
              <tr key={a._id}>
                <td>{a.academicYear}</td>
                <td>{a.academicPeriod}</td>
                <td>
                   {a.periodStart
                    ? new Date(a.periodStart).toLocaleDateString()
                    : "—"}
                </td>

                <td>
                   {a.periodEnd
                    ? new Date(a.periodEnd).toLocaleDateString()
                    : "—"}
                </td>
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
                  {(a.documents || []).length ? (
                    a.documents.map((d, i) => (
                      <a
                        key={i}
                        href={`${API_URL}${d.fileUrl}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {d.label}
                      </a>
                    ))
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>

                {/*ADMIN FEEDBACK */}
                <td>
                  {a.reviewStatus === "rejected" && a.adminFeedback ? (
                    <div className="admin-feedback">
                      ❗ <b>Admin:</b> {a.adminFeedback}
                    </div>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>

                {/*ACTIONS */}
                <td>
                  {a.reviewStatus === "rejected" ? (
                    <div className="fees-actions">
                      <button
                        className="resubmit-btn"
                        onClick={() => openEditModal(a)}
                      >
                        ✏️ Edit & Resubmit
                      </button>

                      <button
                        className="delete-btn"
                        onClick={() => deleteApplication(a._id)}
                      >
                        🗑 Delete
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

      {/* ================= APPLY MODAL ================= */}
      {showApplyModal && (
        <div className="fee-modal-overlay">
          <div className="fee-modal">
            <h3>💰 Apply for Fees</h3>

            <input
              placeholder="Academic Year (e.g. 2025/2026)"
              value={form.academicYear}
              onChange={(e) =>
                setForm({ ...form, academicYear: e.target.value })
              }
            />

            <select
              value={form.yearOfStudy}
              onChange={(e) =>
                setForm({ ...form, yearOfStudy: e.target.value })
              }
            >
              <option value="">Year of Study</option>
              {[1, 2, 3, 4, 5].map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>

            <select
              value={form.academicPeriod}
              onChange={(e) =>
                setForm({ ...form, academicPeriod: e.target.value })
              }
            >
              <option value="">Select Period</option>
              {form.institutionType === "University" ? (
                <>
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                  <option value="Semester 3">Semester 3</option>
                </>
              ) : (
                <>
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                </>
              )}
            </select>

            <label>Start Date</label>
            <input
              type="date"
              value={form.periodStart}
              onChange={(e) => setForm({ ...form, periodStart: e.target.value })}
            />
            
            <label>End Date</label>
            <input
              type="date"
              value={form.periodEnd}
              onChange={(e) => setForm({ ...form, periodEnd: e.target.value })}
            />

            <input
              type="number"
              placeholder="Amount (KES)"
              value={form.amountRequested}
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

            <label>Other Documents</label>
            <input
              type="file"
              multiple
              onChange={(e) =>
                setForm({ ...form, otherDocs: [...e.target.files] })
              }
            />

            <div className="fee-modal-actions">
              <button className="save-btn" onClick={submit}>
                Submit
              </button>
              <button
                className="cancel-btn"
                onClick={() => setShowApplyModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT MODAL ================= */}
      {editModal && (
        <div className="fee-modal-overlay">
          <div className="fee-modal">
            <h3>✏️ Edit & Resubmit</h3>

            {editingApp?.adminFeedback && (
              <div className="admin-feedback" style={{ marginBottom: 12 }}>
                ❗ <b>Admin Feedback:</b> {editingApp.adminFeedback}
              </div>
            )}

            <input
              placeholder="Academic Year"
              value={editForm.academicYear}
              onChange={(e) =>
                setEditForm({ ...editForm, academicYear: e.target.value })
              }
            />

            <select
              value={editForm.yearOfStudy}
              onChange={(e) =>
                setEditForm({ ...editForm, yearOfStudy: e.target.value })
              }
            >
              <option value="">Year of Study</option>
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
              <option value="">Select Period</option>
              {form.institutionType === "University" ? (
                <>
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                  <option value="Semester 3">Semester 3</option>
                </>
              ) : (
                <>
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                </>
              )}
            </select>

            <input
              type="number"
              placeholder="Amount"
              value={editForm.amountRequested}
              onChange={(e) =>
                setEditForm({ ...editForm, amountRequested: e.target.value })
              }
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
              <button
                className="cancel-btn"
                onClick={() => {
                  setEditModal(false);
                  setEditingApp(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <ChatWidget/>
    </div>
  );
}
