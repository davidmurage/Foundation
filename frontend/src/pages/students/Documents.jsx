import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/Documents.css";
import { API_URL } from "../../utils/config";
import ChatWidget from "../../components/ChatWidget";

export default function Documents() {
  const token = localStorage.getItem("token");

  const [institutionType, setInstitutionType] = useState("");

  const [form, setForm] = useState({
    //name: "",
    admissionNo: "",
    yearOfStudy: "",
    academicPeriod: "",
    documentType: "",
    document: null,
  });

  const [docs, setDocs] = useState([]);
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [filters, setFilters] = useState({
    yearOfStudy: "",
    academicPeriod: "",
    documentType: "",
  });

  /* ================= LOAD STUDENT PROFILE ================= */
  useEffect(() => {
    axios
      .get(`${API_URL}/api/student/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setInstitutionType(res.data.institutionType); // University or TVET
        setForm((f) => ({
          ...f,
          //name: res.data.fullName || "",
          admissionNo: res.data.admissionNo || res.data.registrationNo || "",
        }));
      })
      .catch((err) => console.error("PROFILE LOAD ERROR:", err));
  }, [token]);

  /* ================= LOAD DOCUMENTS ================= */
  useEffect(() => {
    axios
      .get(`${API_URL}/api/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setDocs(res.data))
      .catch((err) => console.error(err));
  }, [token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setForm({ ...form, document: e.target.files[0] });
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    if (!form.document) {
      setMessage("Please select a file");
      return;
    }

    const formData = new FormData();

    //append fields EXPLICITLY
    formData.append("admissionNo", form.admissionNo);
    formData.append("yearOfStudy", form.yearOfStudy);
    formData.append("academicPeriod", form.academicPeriod);
    formData.append("documentType", form.documentType);
    formData.append("institutionType", institutionType);
    formData.append("document", form.document);

    const res = await axios.post(
      `${API_URL}/api/documents/upload`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setMessage(res.data.message);
    setDocs([res.data.document, ...docs]);
    setShowForm(false);

  } catch (err) {
    setMessage(err.response?.data?.message || "Upload failed");
  }
};


  /* ================= DELETE ================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this document?")) return;

    try {
      await axios.delete(`${API_URL}/api/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocs(docs.filter((d) => d._id !== id));
      setMessage("Document deleted");
    } catch (err) {
      setMessage("Delete failed");
    }
  };

  /* ================= FILTER ================= */
  const filteredDocs = docs.filter((doc) => {
    return (
      (!filters.yearOfStudy || doc.yearOfStudy === filters.yearOfStudy) &&
      (!filters.academicPeriod ||
        doc.academicPeriod === filters.academicPeriod) &&
      (!filters.documentType || doc.documentType === filters.documentType)
    );
  });

  return (
    <div className="docs-container">
      <h2>📄 Academic Documents</h2>
      {message && <p className="message">{message}</p>}

      {/* ================= FILTER BAR ================= */}
      <div className="filter-bar">
        <select
          value={filters.yearOfStudy}
          onChange={(e) =>
            setFilters({ ...filters, yearOfStudy: e.target.value })
          }
        >
          <option value="">All Years</option>
          {[1, 2, 3, 4, 5].map((y) => (
            <option key={y} value={String(y)}>
              Year {y}
            </option>
          ))}
        </select>

        <select
          value={filters.academicPeriod}
          onChange={(e) =>
            setFilters({ ...filters, academicPeriod: e.target.value })
          }
        >
          <option value="">All Periods</option>

          {institutionType === "University" && (
            <>
              <option value="Sem 1">Semester 1</option>
              <option value="Sem 2">Semester 2</option>
              <option value="Sem 3">Semester 3</option>
              <option value="Semester 1&2">
                Semester 1 & 2 (Combined)
              </option>
              <option value="Semester 1&2&3">
                Semester 1, 2 & 3 (Combined)
              </option>
              <option value="Attachment">Attachment</option>
            </>
          )}

          {institutionType === "TVET" && (
            <>
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </>
          )}
        </select>

        <select
          value={filters.documentType}
          onChange={(e) =>
            setFilters({ ...filters, documentType: e.target.value })
          }
        >
          <option value="">All Types</option>
          <option value="Fee Structure">Fee Structure</option>
          <option value="Fee Statement">Fee Statement</option>
          <option value="Transcript">Transcript</option>
          <option value="Department Letter">Department Letter</option>
        </select>
      </div>

      <button className="upload-btn" onClick={() => setShowForm(true)}>
        + Upload New Document
      </button>

      {/* ================= MODAL ================= */}
      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <h3>Upload Document</h3>

            <form onSubmit={handleSubmit} className="docs-form">
              {/*<input value={form.name} placeholder="FullName" />*/}
              <input value={form.admissionNo} name="admissionNo" readonly />

              <select
                name="yearOfStudy"
                value={form.yearOfStudy}
                onChange={handleChange}
                required
              >
                <option value="">Select Year</option>
                {[1, 2, 3, 4, 5].map((y) => (
                  <option key={y} value={String(y)}>
                    Year {y}
                  </option>
                ))}
              </select>

              <select
                name="academicPeriod"
                value={form.academicPeriod}
                onChange={handleChange}
                required
              >
                <option value="">Select Period</option>

                {institutionType === "University" && (
                  <>
                    <option value="Sem 1">Semester 1</option>
                    <option value="Sem 2">Semester 2</option>
                    <option value="Sem 3">Semester 3</option>
                    <option value="Semester 1&2">
                      Semester 1 & 2 (Combined)
                    </option>
                    <option value="Semester 1&2&3">
                      Semester 1, 2 & 3 (Combined)
                    </option>
                    <option value="Attachment">Attachment</option>
                  </>
                )}

                {institutionType === "TVET" && (
                  <>
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                  </>
                )}
              </select>

              <select
                name="documentType"
                value={form.documentType}
                onChange={handleChange}
                required
              >
                <option value="">Select Document Type</option>
                <option value="Fee Structure">Fee Structure</option>
                <option value="Fee Statement">Fee Statement</option>
                <option value="Transcript">Transcript</option>
                <option value="Department Letter">Department Letter</option>
              </select>

              <input type="file" onChange={handleFileChange} required />

              <div className="modal-actions">
                <button type="submit">Upload</button>
                <button type="button" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= TABLE ================= */}
      <table className="docs-table">
        <thead>
          <tr>
            {/*<th>AdmissionNo</th>*/}
            <th>Year</th>
            <th>Period</th>
            <th>Type</th>
            <th>Uploaded</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {filteredDocs.map((doc) => (
            <tr key={doc._id}>
              {/*<td>{doc.admissionNo}</td>*/}
              <td>{doc.yearOfStudy}</td>
              <td>{doc.academicPeriod}</td>
              <td>{doc.documentType}</td>
              <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
              <td>
                <a href={`${API_URL}${doc.fileUrl}`} target="_blank" rel="noreferrer">
                  View
                </a>{" "}
                |{" "}
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(doc._id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ChatWidget/>
    </div>
  );
}
