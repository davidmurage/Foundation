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
    code: "",
    logoUrl: "",
    description: "",
    isActive: true,
  });

  const loadInstitutions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filters.type) params.append("type", filters.type);
      if (filters.county) params.append("county", filters.county);
      if (filters.active !== "") params.append("active", filters.active);

      const res = await axios.get(
        `${API_URL}/api/admin?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setInstitutions(res.data || []);
    } catch (err) {
      console.error("LOAD INSTITUTIONS ERROR:", err);
      alert("Failed to load institutions");
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
      code: "",
      logoUrl: "",
      description: "",
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
      code: inst.code || "",
      logoUrl: inst.logoUrl || "",
      description: inst.description || "",
      isActive: inst.isActive !== false,
    });
    setSelected(inst);
    setEditMode(true);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editMode && selected) {
        await axios.put(
          `${API_URL}/api/admin/${selected._id}`,
          form,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(`${API_URL}/api/admin`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setModalOpen(false);
      loadInstitutions();
    } catch (err) {
      console.error("SAVE INSTITUTION ERROR:", err);
      alert(err.response?.data?.message || "Error saving institution");
    }
  };

  const handleDelete = async (inst) => {
    if (!window.confirm(`Delete institution "${inst.name}"?`)) return;

    try {
      await axios.delete(
        `${API_URL}/api/admin/${inst._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      loadInstitutions();
    } catch (err) {
      console.error("DELETE INSTITUTION ERROR:", err);
      alert("Error deleting institution");
    }
  };

  return (
    <div className="admin-layout-wrapper">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main content */}
      <main className="admin-main-content">
        <div className="institutions-header">
          <h2>🏫 Institutions</h2>
          <button className="add-btn" onClick={openAddModal}>
            + Add Institution
          </button>
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
            onChange={(e) =>
              setFilters({ ...filters, type: e.target.value })
            }
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
                <th>Logo</th>
                <th>Name</th>
                <th>Type</th>
                <th>County</th>
                <th>Location</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {institutions.map((inst) => (
                <tr key={inst._id}>
                  <td>
                    {inst.logoUrl ? (
                      <img
                        src={inst.logoUrl}
                        alt={inst.name}
                        className="inst-logo-mini"
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{inst.name}</td>
                  <td>{inst.type}</td>
                  <td>{inst.county || "—"}</td>
                  <td>{inst.location || "—"}</td>
                  <td>
                    <span
                      className={
                        inst.isActive ? "badge badge-active" : "badge badge-inactive"
                      }
                    >
                      {inst.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <Link
                      to={`/admin-dashboard/institutions/${inst._id}`}
                      className="btn-link"
                    >
                      View
                    </Link>
                    <button
                      className="edit-btn"
                      onClick={() => openEditModal(inst)}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(inst)}
                    >
                      Delete
                    </button>
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
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  required
                />

                <label>Type *</label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value })
                  }
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

                <label>Institution Code</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value })
                  }
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
                />

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
