// src/pages/admin/AdminInstitutions.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API_URL } from "../../utils/config";

import AdminSidebar from "../../components/admin/AdminSidebar";
import "../../styles/admin/AdminLayoutBase.css";
import "../../styles/admin/AdminInstitutions.css";

export default function AdminInstitutions() {
  const token = localStorage.getItem("token");

  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    type: "",
    county: "",
    active: "",
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState(null);

  const [form, setForm] = useState({
    name: "",
    type: "University",
    county: "",
    location: "",
    isActive: true,
  });

  const [bulkFile, setBulkFile] = useState(null);
  const [bulkUploading, setBulkUploading] = useState(false);

  const handlePickBulkFile = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Optional: basic validation
  if (!file.name.toLowerCase().endsWith(".csv")) {
    alert("Please upload a CSV file (.csv)");
    e.target.value = "";
    return;
  }

  setBulkFile(file);
};

const uploadBulkFile = async () => {
  if (!bulkFile) {
    alert("Please select a CSV file first.");
    return;
  }

  const fd = new FormData();
  fd.append("file", bulkFile);

  try {
    setBulkUploading(true);

    const res = await axios.post(
      `${API_URL}/api/institutions/bulk-upload`,
      fd,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          // DO NOT set Content-Type manually for FormData; browser will set boundary
        },
      }
    );

    alert(
      `${res.data.message}\nAdded: ${res.data.added}\nSkipped: ${res.data.skipped}`
    );

    setBulkFile(null);
    await loadInstitutions();
  } catch (err) {
    console.error("BULK UPLOAD ERROR:", err);
    alert(err.response?.data?.message || "Bulk upload failed");
  } finally {
    setBulkUploading(false);
  }
};


  // Correct endpoint
  const loadInstitutions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filters.type) params.append("type", filters.type);
      if (filters.county) params.append("county", filters.county);
      if (filters.active !== "") params.append("active", filters.active);

      const res = await axios.get(
        `${API_URL}/api/institutions?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setInstitutions(res.data || []);
    } catch (err) {
      console.error("LOAD INSTITUTIONS ERROR:", err);
      alert(err.response?.data?.message || "Failed to load institutions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstitutions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAddModal = () => {
    setForm({
      name: "",
      type: "University",
      county: "",
      location: "",
      isActive: true,
    });
    setSelected(null);
    setEditMode(false);
    setModalOpen(true);
  };

  const openEditModal = (inst) => {
    setForm({
      name: inst.name || "",
      type: inst.type || "University",
      county: inst.county || "",
      location: inst.location || "",
      isActive: inst.isActive !== false,
    });
    setSelected(inst);
    setEditMode(true);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Institution name is required");
      return;
    }

    try {
      if (editMode && selected?._id) {
        await axios.put(
          `${API_URL}/api/institutions/${selected._id}`,
          form,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(`${API_URL}/api/institutions`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setModalOpen(false);
      await loadInstitutions();
    } catch (err) {
      console.error("SAVE INSTITUTION ERROR:", err);
      alert(err.response?.data?.message || "Error saving institution");
    }
  };

  const handleDelete = async (inst) => {
    if (!window.confirm(`Delete institution "${inst.name}"?`)) return;

    try {
      await axios.delete(`${API_URL}/api/institutions/${inst._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadInstitutions();
    } catch (err) {
      console.error("DELETE INSTITUTION ERROR:", err);
      alert(err.response?.data?.message || "Error deleting institution");
    }
  };

  return (
    <div className="admin-layout-wrapper">
      <AdminSidebar />

      <main className="admin-main-content">
        <div className="institutions-header">
  <h2>🏫 Institutions</h2>

  <div className="institutions-actions">
    {/* Hidden file input */}
    <input
      id="bulkCsvInput"
      type="file"
      accept=".csv"
      onChange={handlePickBulkFile}
      style={{ display: "none" }}
    />

    {/* Pick file */}
    <button
      type="button"
      className="upload-btn"
      onClick={() => document.getElementById("bulkCsvInput").click()}
      disabled={bulkUploading}
    >
      📥 Choose CSV
    </button>

    {/* Show selected file name */}
    <span className="bulk-file-name">
      {bulkFile ? bulkFile.name : "No file selected"}
    </span>

    {/* Upload */}
    <button
      type="button"
      className="upload-confirm-btn"
      onClick={uploadBulkFile}
      disabled={!bulkFile || bulkUploading}
    >
      {bulkUploading ? "Uploading..." : "⬆️ Upload"}
    </button>

    {/* Existing add button */}
    <button className="add-btn" onClick={openAddModal} disabled={bulkUploading}>
      + Add Institution
    </button>
  </div>
</div>


        {/* Filters */}
        <div className="institutions-filterbar">
          <input
            placeholder="Search by name, county, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="">All Types</option>
            <option value="University">University</option>
            <option value="TVET">TVET</option>
          </select>

          <select
            value={filters.active}
            onChange={(e) =>
              setFilters({ ...filters, active: e.target.value })
            }
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <button onClick={loadInstitutions} disabled={loading}>
            {loading ? "Loading..." : "Apply"}
          </button>
        </div>

        {/* Table */}
        <div className="institutions-table-wrapper">
          <table className="institutions-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>County</th>
                <th>Location</th>
                <th>Status</th>
                <th>Students</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {institutions.map((inst) => (
                <tr key={inst._id}>
  <td>{inst.name}</td>
  <td>{inst.type}</td>
  <td>{inst.county || "—"}</td>
  <td>{inst.location || "—"}</td>
  <td>
    <span className={inst.isActive ? "badge badge-active" : "badge badge-inactive"}>
      {inst.isActive ? "Active" : "Inactive"}
    </span>
  </td>
  <td>
    <strong>{inst.totalStudents}</strong>
  </td>
  <td className="actions-cell">
    <button className="edit-btn" onClick={() => openEditModal(inst)}>Edit</button>
    <button className="delete-btn" onClick={() => handleDelete(inst)}>Delete</button>
  </td>
</tr>

              ))}

              {!institutions.length && !loading && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center" }}>
                    No institutions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>{editMode ? "Edit Institution" : "Add Institution"}</h3>

              <form onSubmit={handleSave}>
                <label>Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />

                <label>Type *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  required
                >
                  <option value="University">University</option>
                  <option value="TVET">TVET</option>
                </select>

                <label>County</label>
                <input
                  type="text"
                  value={form.county}
                  onChange={(e) =>
                    setForm({ ...form, county: e.target.value })
                  }
                />

                <label>Location / Campus</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                />

                {/*<label>Institution Code</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />

                <label>Logo URL</label>
                <input
                  type="text"
                  value={form.logoUrl}
                  onChange={(e) =>
                    setForm({ ...form, logoUrl: e.target.value })
                  }
                  placeholder="https://..."
                />

                <label>Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />*/}

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm({ ...form, isActive: e.target.checked })
                    }
                  />
                  <span>Active institution</span>
                </label>

                <div className="modal-actions">
                  <button type="submit" className="save-btn">
                    Save
                  </button>
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
