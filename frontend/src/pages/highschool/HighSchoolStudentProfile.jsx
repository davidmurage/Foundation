import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../../utils/config";

import HighSchoolSidebar from "../../components/HighSchool/HighSchoolSidebar";
import "../../styles/highschool/HighSchoolStudentProfile.css";

export default function HighSchoolStudentProfile() {
  const { id } = useParams();
  const token = localStorage.getItem("token");

  const [bundle, setBundle] = useState(null);
  const [tab, setTab] = useState("overview");

  // modals
  const [perfModal, setPerfModal] = useState(false);
  const [docModal, setDocModal] = useState(false);
  const [editingFee, setEditingFee] = useState(null);


  // forms
  const [perfForm, setPerfForm] = useState({
    academicYear: "",
    term: "Term 1",
    examName: "End Term",
    meanScore: "",
    meanGrade: "",
    remarks: "",
  });

  const [docForm, setDocForm] = useState({
    type: "performance",
    title: "",
    file: null,
  });

  const [editingPerf, setEditingPerf] = useState(null);
  const [feeModal, setFeeModal] = useState(false);
  const [feeForm, setFeeForm] = useState({
  academicYear: "",
  term: "Term 1",
  totalFees: "",
  paidAmount: "",
  feeStructure: null,
  feeStatement: null,
});

  const openEditPerformance = (p) => {
  setPerfForm({
    academicYear: p.academicYear,
    term: p.term,
    examName: p.examName,
    meanScore: p.meanScore || "",
    meanGrade: p.meanGrade || "",
    competencyLevel: p.competencyLevel || "",
    learningArea: p.learningArea || "",
    remarks: p.remarks || "",
  });

  setEditingPerf(p);
  setPerfModal(true);
};

const openEditFee = (f) => {
  setFeeForm({
    academicYear: f.academicYear,
    term: f.term,
    totalFees: f.totalFees,
    paidAmount: f.paidAmount,
  });

  setEditingFee(f);
  setFeeModal(true);
};

const deleteFee = async (feeId) => {
  if (!window.confirm("Delete fee record?")) return;

  await axios.delete(
    `${API_URL}/api/highschool/student/fees/${feeId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  load();
};



const deletePerformance = async (perfId) => {
  if (!window.confirm("Delete performance record?")) return;

  await axios.delete(
    `${API_URL}/api/highschool/student/performance/${perfId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  load();
};



 const load = async () => {
    const res = await axios.get(`${API_URL}/api/highschool/student/${id}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setBundle(res.data);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [id]);

  if (!bundle) return <p style={{ padding: 20 }}>Loading student profile...</p>;

  const { student, performance, feeRecords, documents } = bundle;



  const submitPerformance = async (e) => {
  e.preventDefault();

  if (editingPerf) {
    // UPDATE
    await axios.put(
      `${API_URL}/api/highschool/student/performance/${editingPerf._id}`,
      perfForm,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } else {
    // CREATE
    await axios.post(
      `${API_URL}/api/highschool/student/${id}/performance`,
      perfForm,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  setPerfModal(false);
  setEditingPerf(null);

  setPerfForm({
    academicYear: "",
    term: "Term 1",
    examName: "End Term",
    meanScore: "",
    meanGrade: "",
    competencyLevel: "",
    learningArea: "",
    remarks: "",
  });

  load();
};


const submitFees = async (e) => {
  e.preventDefault();

  const payload = {
    academicYear: feeForm.academicYear,
    term: feeForm.term,
    totalFees: feeForm.totalFees,
    paidAmount: feeForm.paidAmount || 0,
  };

  if (editingFee) {
    await axios.put(
      `${API_URL}/api/highschool/student/${id}/fees`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } else {
    await axios.post(
      `${API_URL}/api/highschool/student/fees/${id}`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  }

  setFeeModal(false);
  setEditingFee(null);
  load();
};



  const submitDoc = async (e) => {
    e.preventDefault();
    if (!docForm.file) return alert("Select a file");

    const fd = new FormData();
    fd.append("type", docForm.type);
    fd.append("title", docForm.title);
    fd.append("file", docForm.file);

    await axios.post(`${API_URL}/api/highschool/student/${id}/documents`, fd, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setDocModal(false);
    setDocForm({ type: "performance", title: "", file: null });
    load();
  };

  const deleteDoc = async (docId) => {
    if (!window.confirm("Delete document?")) return;
    await axios.delete(`${API_URL}/api/highschool/student/documents/${docId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    load();
  };

  return (
    <div className="hs-layout">
      <HighSchoolSidebar />

      <main className="hs-main">
        <div className="profile-top">
          <div>
            <h2>👨‍🎓 {student.fullName}</h2>
            <p className="sub">
              RegNo: <b>{student.registrationNo || "—"}</b> • System:{" "}
              <b>{student.curriculum}</b> • Level: <b>{student.level}</b>
            </p>
          </div>

          <div className={`status-pill ${student.sponsorshipStatus || "pending"}`}>
            {student.sponsorshipStatus || "pending"}
          </div>
        </div>

        {/* TABS */}
        <div className="tabs">
          <button className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")}>
            Overview
          </button>
          <button className={tab === "performance" ? "active" : ""} onClick={() => setTab("performance")}>
            Performance
          </button>
          <button className={tab === "fees" ? "active" : ""} onClick={() => setTab("fees")}>
            Fees
          </button>
          <button className={tab === "documents" ? "active" : ""} onClick={() => setTab("documents")}>
            Documents
          </button>
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div className="card">
            <div className="grid-2">
              <div className="info">
                <span>Gender</span>
                <b>{student.gender}</b>
              </div>
              <div className="info">
                <span>Academic Year</span>
                <b>{student.academicYear}</b>
              </div>
              <div className="info">
                <span>Term</span>
                <b>{student.term}</b>
              </div>
              <div className="info">
                <span>Fees Amount</span>
                <b>KES {Number(student.feesAmount || 0).toLocaleString()}</b>
              </div>
            </div>
          </div>
        )}

        {/* PERFORMANCE */}
        {tab === "performance" && (
          <div className="card">
            <div className="card-head">
              <h3>📊 Performance Records</h3>
              <button className="btn" onClick={() => setPerfModal(true)}>
                + Add Performance
              </button>
            </div>

            <div className="table-wrapper">
              <table className="hs-table">
                <thead>
  <tr>
    <th>Year</th>
    <th>Term</th>
    <th>Assessment</th>
    <th>Details</th>
    <th>Remarks</th>
    <th>Actions</th>

  </tr>
</thead>

<tbody>
  {performance.map((p) => (
    <tr key={p._id}>
      <td>{p.academicYear}</td>
      <td>{p.term}</td>
      <td>{p.examName}</td>
      <td>
        {p.curriculum === "CBC" ? (
          <>
            <strong>{p.learningArea}</strong>
            <div className="cbc-badge">{p.competencyLevel}</div>
          </>
        ) : (
          <>
            Score: <strong>{p.meanScore}</strong> | Grade:{" "}
            <strong>{p.meanGrade}</strong>
          </>
        )}
      </td>
      <td>{p.remarks || "—"}</td>
      <td className="actions-cell">
  <button
    className="btn-edit"
    onClick={() => openEditPerformance(p)}
  >
    ✏️ Edit
  </button>

  <button
    className="btn-delete"
    onClick={() => deletePerformance(p._id)}
  >
    🗑 Delete
  </button>
</td>
    </tr>
  ))}
</tbody>

              </table>
            </div>
          </div>
        )}

        {/* FEES */}
        {tab === "fees" && (
          <div className="card">
            <h3>💰 Fee Records</h3>
            <button className="btn" onClick={() => setFeeModal(true)}>
              + Add Fee Record
            </button>
            <div className="table-wrapper">
              <table className="hs-table">
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Term</th>
                    <th>Total Fees</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {feeRecords.map((f) => (
                    <tr key={f._id}>
                      <td>{f.academicYear}</td>
                      <td>{f.term}</td>
                      <td>KES {Number(f.totalFees).toLocaleString()}</td>
                      <td>KES {Number(f.paidAmount || 0).toLocaleString()}</td>
                      <td>
                        KES {Number((f.totalFees || 0) - (f.paidAmount || 0)).toLocaleString()}
                      </td>
                      <td className="actions-cell">
                        <button className="btn-edit" onClick={() => openEditFee(f)}>
                         ✏️ Edit
                        </button>
                        <button className="btn-delete" onClick={() => deleteFee(f._id)}>
                          🗑 Delete
                        </button>
                      </td>

                    </tr>
                  ))}
                  {!feeRecords.length && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center" }}>
                        No fee records yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            
          </div>
        )}

        {/* DOCUMENTS */}
        {tab === "documents" && (
          <div className="card">
            <div className="card-head">
              <h3>📎 Uploaded Documents</h3>
              <button className="btn" onClick={() => setDocModal(true)}>
                + Upload Document
              </button>
            </div>

            <div className="docs-grid">
              {documents.map((d) => (
                <div className="doc-item" key={d._id}>
                  <div>
                    <b>{d.title || d.originalName}</b>
                    <div className="doc-meta">
                      <span className="doc-tag">{d.type}</span>
                      <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="doc-actions">
                    <a className="btn-link" href={`${API_URL}${d.fileUrl}`} target="_blank" rel="noreferrer">
                      View
                    </a>
                    <button className="btn-danger" onClick={() => deleteDoc(d._id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              {!documents.length && <p style={{ marginTop: 10 }}>No documents uploaded yet.</p>}
            </div>
          </div>
        )}

{/* PERFORMANCE MODAL */}
 {perfModal && (
  <div className="modal-overlay">
    <div className="modal modal-scroll">
      <h3>Add Performance</h3>

      <form onSubmit={submitPerformance} className="modal-form">
        <input
          placeholder="Academic Year (e.g 2026)"
          value={perfForm.academicYear}
          onChange={(e) =>
            setPerfForm({ ...perfForm, academicYear: e.target.value })
          }
          required
        />

        <select
          value={perfForm.term}
          onChange={(e) =>
            setPerfForm({ ...perfForm, term: e.target.value })
          }
          required
        >
          <option>Term 1</option>
          <option>Term 2</option>
          <option>Term 3</option>
        </select>

        <input
          placeholder="Assessment Name (e.g Mid Term / End Term)"
          value={perfForm.examName}
          onChange={(e) =>
            setPerfForm({ ...perfForm, examName: e.target.value })
          }
        />

        {/* ===== CBC ===== */}
        {student.curriculum === "CBC" && (
          <>
            <input
              placeholder="Learning Area (e.g Mathematics)"
              value={perfForm.learningArea}
              onChange={(e) =>
                setPerfForm({ ...perfForm, learningArea: e.target.value })
              }
              required
            />

            <select
              value={perfForm.competencyLevel}
              onChange={(e) =>
                setPerfForm({ ...perfForm, competencyLevel: e.target.value })
              }
              required
            >
              <option value="">Competency Level</option>
              <option>Exceeds Expectations</option>
              <option>Meets Expectations</option>
              <option>Approaching Expectations</option>
              <option>Below Expectations</option>
            </select>
          </>
        )}

        {/* ===== 8-4-4 ===== */}
        {student.curriculum === "844" && (
          <>
            <input
              type="number"
              placeholder="Mean Score"
              value={perfForm.meanScore}
              onChange={(e) =>
                setPerfForm({ ...perfForm, meanScore: e.target.value })
              }
              required
            />

            <input
              placeholder="Mean Grade (A–E)"
              value={perfForm.meanGrade}
              onChange={(e) =>
                setPerfForm({ ...perfForm, meanGrade: e.target.value })
              }
              required
            />
          </>
        )}

        <textarea
          rows={3}
          placeholder="Remarks (optional)"
          value={perfForm.remarks}
          onChange={(e) =>
            setPerfForm({ ...perfForm, remarks: e.target.value })
          }
        />

        <div className="modal-actions">
          <button className="btn" type="submit">
            Save
          </button>
          <button
            className="btn-ghost"
            type="button"
            onClick={() => setPerfModal(false)}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
)}

{/* FEES MODAL */}
{feeModal && (
  <div className="modal-overlay">
    <div className="modal modal-scroll">
      <h3>Add Fee Record</h3>

      <form onSubmit={submitFees} className="modal-form">
        <input
          placeholder="Academic Year (e.g 2026)"
          value={feeForm.academicYear}
          onChange={(e) =>
            setFeeForm({ ...feeForm, academicYear: e.target.value })
          }
          required
        />

        <select
          value={feeForm.term}
          onChange={(e) =>
            setFeeForm({ ...feeForm, term: e.target.value })
          }
          required
        >
          <option>Term 1</option>
          <option>Term 2</option>
          <option>Term 3</option>
        </select>

        <input
          type="number"
          placeholder="Total Fees (KES)"
          value={feeForm.totalFees}
          onChange={(e) =>
            setFeeForm({ ...feeForm, totalFees: e.target.value })
          }
          required
        />

        <input
          type="number"
          placeholder="Paid Amount (KES)"
          value={feeForm.paidAmount}
          onChange={(e) =>
            setFeeForm({ ...feeForm, paidAmount: e.target.value })
          }
        />

        {/*<label className="file-label">
          📄 Upload Fee Structure (PDF)
          <input
            type="file"
            accept=".pdf"
            onChange={(e) =>
              setFeeForm({ ...feeForm, feeStructure: e.target.files[0] })
            }
          />
        </label>

        <label className="file-label">
          🧾 Upload Fee Statement (PDF)
          <input
            type="file"
            accept=".pdf"
            onChange={(e) =>
              setFeeForm({ ...feeForm, feeStatement: e.target.files[0] })
            }
          />
        </label>*/}

        <div className="modal-actions">
          <button className="btn" type="submit">
            Save
          </button>
          <button
            className="btn-ghost"
            type="button"
            onClick={() => setFeeModal(false)}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
)}



        {/* DOC MODAL */}
        {docModal && (
          <div className="modal-overlay">
            <div className="modal modal-scroll">
              <h3>Upload Document</h3>

              <form onSubmit={submitDoc} className="modal-form">
                <select
                  value={docForm.type}
                  onChange={(e) => setDocForm({ ...docForm, type: e.target.value })}
                  required
                >
                  <option value="performance">Performance</option>
                  <option value="fee_structure">Fee Structure</option>
                  <option value="fee_statement">Fee Statement</option>
                  <option value="other">Other</option>
                </select>

                <input
                  placeholder="Title (optional)"
                  value={docForm.title}
                  onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                />

                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setDocForm({ ...docForm, file: e.target.files?.[0] || null })}
                  required
                />

                <div className="modal-actions">
                  <button className="btn" type="submit">Upload</button>
                  <button className="btn-ghost" type="button" onClick={() => setDocModal(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
