import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/Documents.css";
import { API_URL } from "../../utils/config";

export default function Documents() {
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    name: "",
    admissionNo: "",
    yearOfStudy: "",
    institutionType: "",
    academicPeriod: "",
    documentType: "",
    document: null,
  });

  const [docs, setDocs] = useState([]);
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState({
    yearOfStudy: "",
    academicPeriod: "",
    documentType: "",
  });
  const [showForm, setShowForm] = useState(false);

  // Fetch uploaded documents
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(form).forEach((key) => {
        formData.append(key, form[key]);
      });

      const res = await axios.post(`${API_URL}/api/documents/upload`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage(res.data.message);
      setDocs([res.data.document, ...docs]);
      setShowForm(false);
    } catch (err) {
      setMessage(err.response?.data?.message || "Upload failed");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      try {
        await axios.delete(`${API_URL}/api/documents/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDocs(docs.filter((doc) => doc._id !== id));
        setMessage("Document deleted successfully");
      } catch (err) {
        setMessage(err.response?.data?.message || "Delete failed");
      }
    }
  };

  // Apply filters
  const filteredDocs = docs.filter((doc) => {
    return (
      (!filters.yearOfStudy || doc.yearOfStudy === filters.yearOfStudy) &&
      (!filters.academicPeriod || doc.academicPeriod === filters.academicPeriod) &&
      (!filters.documentType || doc.documentType === filters.documentType)
    );
  });

  return (
    <div className="docs-container">
      <h2>📄 Documents</h2>
      {message && <p className="message">{message}</p>}

      {/* Filter Bar */}
      <div className="filter-bar">
        {/* Year filter */}
        <select
          name="yearOfStudy"
          value={filters.yearOfStudy}
          onChange={(e) =>
            setFilters({ ...filters, yearOfStudy: e.target.value })
          }
        >
          <option value="">All Years</option>
          <option value="1">Year 1</option>
          <option value="2">Year 2</option>
          <option value="3">Year 3</option>
          <option value="4">Year 4</option>
          <option value="5">Year 5</option>
        </select>

        {/* Academic period filter */}
        <select
          name="academicPeriod"
          value={filters.academicPeriod}
          onChange={(e) =>
            setFilters({ ...filters, academicPeriod: e.target.value })
          }
        >
          <option value="">All Periods</option>

          {/* UNIVERSITY FILTER OPTIONS */}
          <option value="Sem 1 & Sem 2 (Combined)">
            Year Transcript (2 Semesters)
          </option>

          <option value="Sem 1 & Sem 2 & Sem 3 (Combined)">
            Year Transcript (3 Semesters)
          </option>

          <option value="Attachment">Attachment</option>

          {/* TVET remains unchanged */}
          <option value="Term 1">Term 1</option>
          <option value="Term 2">Term 2</option>
          <option value="Term 3">Term 3</option>
        </select>

        {/* Document type filter */}
        <select
          name="documentType"
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

      {/* Upload new document */}
      <button className="upload-btn" onClick={() => setShowForm(true)}>
        + Upload New Document
      </button>

      {/* Upload Form Modal */}
      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <h3>Upload Document</h3>
            <form onSubmit={handleSubmit} className="docs-form">
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                required
              />

              <input
                type="text"
                name="admissionNo"
                placeholder="Admission Number"
                value={form.admissionNo}
                onChange={handleChange}
                required
              />

              {/* Year of Study */}
              <select
                name="yearOfStudy"
                value={form.yearOfStudy}
                onChange={handleChange}
                required
              >
                <option value="">Select Year of Study</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
                <option value="5">Year 5</option>
              </select>

              {/* Institution Type */}
              <select
                name="institutionType"
                value={form.institutionType}
                onChange={handleChange}
                required
              >
                <option value="">Select Institution Type</option>
                <option value="University">University</option>
                <option value="TVET">TVET / College</option>
              </select>

              {/* Academic Period — Dynamic */}
              {form.institutionType === "University" && (
                <select
                  name="academicPeriod"
                  value={form.academicPeriod}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select  Period</option>

                  <option value="Sem 1">
                    Semester 1
                  </option>

                  <option value="Sem 2">
                    Semester 2
                  </option>

                  <option value="Sem 3">
                    Semester 3
                  </option>

                  {/* NEW: Combined year transcripts */}
                  <option value="Semester 1&2">
                    Semester 1 &amp; 2 - Combined Year 
                  </option>
                  <option value="Semester 1&2&3">
                    Semester 1, 2 &amp; 3 - Combined Year 
                  </option>

                  <option value="Attachment">Attachment</option>
                </select>
              )}

              {form.institutionType === "TVET" && (
                <select
                  name="academicPeriod"
                  value={form.academicPeriod}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Term</option>
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                </select>
              )}

              {/* Document Type */}
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

              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                required
              />

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

      {/* Documents Table */}
      <table className="docs-table">
        <thead>
          <tr>
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
              <td>{doc.yearOfStudy}</td>
              <td>{doc.academicPeriod}</td>
              <td>{doc.documentType}</td>
              <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
              <td>
                <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                  View
                </a>
                {" | "}
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
    </div>
  );
}
