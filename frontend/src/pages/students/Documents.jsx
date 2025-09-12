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
  const [filters, setFilters] = useState({ yearOfStudy: "", academicPeriod: "", documentType: "" });
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
      formData.append("name", form.name);
      formData.append("admissionNo", form.admissionNo);
      formData.append("yearOfStudy", form.yearOfStudy);
      formData.append("institutionType", form.institutionType);
      formData.append("academicPeriod", form.academicPeriod);
      formData.append("documentType", form.documentType);
      if (form.document) formData.append("document", form.document);

      const res = await axios.post(`${API_URL}/api/documents/upload`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage(res.data.message);
      setDocs([res.data.document, ...docs]);
      setShowForm(false); // close modal after upload
    } catch (err) {
      setMessage(err.response?.data?.message || "Upload failed");
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
        <select name="yearOfStudy" value={filters.yearOfStudy} onChange={(e) => setFilters({ ...filters, yearOfStudy: e.target.value })}>
          <option value="">All Years</option>
          <option value="1">Year 1</option>
          <option value="2">Year 2</option>
          <option value="3">Year 3</option>
          <option value="4">Year 4</option>
          <option value="5">Year 5</option>
        </select>

        <select name="academicPeriod" value={filters.academicPeriod} onChange={(e) => setFilters({ ...filters, academicPeriod: e.target.value })}>
          <option value="">All Periods</option>
          <option value="Semester 1">Semester 1</option>
          <option value="Semester 2">Semester 2</option>
          <option value="Term 1">Term 1</option>
          <option value="Term 2">Term 2</option>
          <option value="Term 3">Term 3</option>
        </select>

        <select name="documentType" value={filters.documentType} onChange={(e) => setFilters({ ...filters, documentType: e.target.value })}>
          <option value="">All Types</option>
          <option value="Fee Structure">Fee Structure</option>
          <option value="Fee Statement">Fee Statement</option>
          <option value="Transcript">Transcript</option>
          <option value="Department Letter">Department Letter</option>
        </select>
      </div>

      {/* Upload New Button */}
      <button className="upload-btn" onClick={() => setShowForm(true)}>+ Upload New Document</button>

      {/* Upload Form Modal */}
      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <h3>Upload Document</h3>
            <form onSubmit={handleSubmit} className="docs-form">
              <input type="text" name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required />
              <input type="text" name="admissionNo" placeholder="Admission Number" value={form.admissionNo} onChange={handleChange} required />

              {/* Year of Study */}
              <select name="yearOfStudy" value={form.yearOfStudy} onChange={handleChange} required>
                <option value="">Select Year of Study</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
                <option value="5">Year 5</option>
              </select>

              {/* Institution Type */}
              <select name="institutionType" value={form.institutionType} onChange={handleChange} required>
                <option value="">Select Institution Type</option>
                <option value="University">University</option>
                <option value="TVET">TVET / College</option>
              </select>

              {/* Academic Period */}
              {form.institutionType === "University" && (
                <select name="academicPeriod" value={form.academicPeriod} onChange={handleChange} required>
                  <option value="">Select Semester</option>
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                </select>
              )}
              {form.institutionType === "TVET" && (
                <select name="academicPeriod" value={form.academicPeriod} onChange={handleChange} required>
                  <option value="">Select Term</option>
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                </select>
              )}

              {/* Document Type */}
              <select name="documentType" value={form.documentType} onChange={handleChange} required>
                <option value="">Select Document Type</option>
                <option value="Fee Structure">Fee Structure</option>
                <option value="Fee Statement">Fee Statement</option>
                <option value="Transcript">Transcript</option>
                <option value="Department Letter">Department Letter</option>
              </select>

              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} required />

              <div className="modal-actions">
                <button type="submit">Upload</button>
                <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
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
                <a href={doc.fileUrl} target="_blank" rel="noreferrer">View</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
