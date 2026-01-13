import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_URL } from "../../utils/config";
import AdminSidebar from "../../components/admin/AdminSidebar";
import "../../styles/admin/AdminLayoutBase.css";
import "../../styles/admin/AdminHighSchools.css";

export default function AdminHighSchools() {
  const token = localStorage.getItem("token");

  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editSchool, setEditSchool] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    county: "",
    status: "",
  });

  const [form, setForm] = useState({
    name: "",
    county: "",
    location: "",
    isActive: true,
  });

  /* ================= LOAD ================= */
  const loadSchools = async () => {
    setLoading(true);
    const res = await axios.get(`${API_URL}/api/highschools`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setSchools(res.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadSchools();
    // eslint-disable-next-line
  }, []);

  /* ================= SAVE ================= */
  const saveSchool = async (e) => {
    e.preventDefault();

    if (editSchool) {
      await axios.put(
        `${API_URL}/api/highschools/${editSchool._id}`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } else {
      await axios.post(`${API_URL}/api/highschools`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    setModalOpen(false);
    setEditSchool(null);
    loadSchools();
  };

  /* ================= DELETE ================= */
  const deleteSchool = async (id) => {
    if (!window.confirm("Delete this high school permanently?")) return;

    try {
      await axios.delete(`${API_URL}/api/highschools/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      loadSchools();
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  /* ================= FILTER ================= */
  const filteredSchools = useMemo(() => {
    return schools.filter((s) => {
      const nameOk =
        !filters.search ||
        s.name.toLowerCase().includes(filters.search.toLowerCase());

      const countyOk = !filters.county || s.county === filters.county;

      const statusOk =
        !filters.status ||
        (filters.status === "active" && s.isActive) ||
        (filters.status === "inactive" && !s.isActive);

      return nameOk && countyOk && statusOk;
    });
  }, [schools, filters]);

  return (
    <div className="admin-layout-wrapper">
      <AdminSidebar />

      <main className="admin-main-content">
        {/* HEADER */}
        <div className="page-header">
          <h2>🏫 High Schools</h2>
          <button className="add-btn" onClick={() => setModalOpen(true)}>
            + Add High School
          </button>
        </div>

        {/* FILTER BAR */}
        <div className="filters-bar">
          <input
            placeholder="Search school..."
            value={filters.search}
            onChange={(e) =>
              setFilters({ ...filters, search: e.target.value })
            }
          />

          <input
            placeholder="County"
            value={filters.county}
            onChange={(e) =>
              setFilters({ ...filters, county: e.target.value })
            }
          />

          <select
            value={filters.status}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value })
            }
          >
            <option value="">Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* TABLE */}
        <div className="table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>County</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredSchools.map((s) => (
                <tr key={s._id}>
                  <td>{s.name}</td>
                  <td>{s.county || "—"}</td>
                  <td>{s.location || "—"}</td>
                  <td>
                    <span className={s.isActive ? "badge active" : "badge inactive"}>
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="edit-btn"
                      onClick={() => {
                        setEditSchool(s);
                        setForm(s);
                        setModalOpen(true);
                      }}
                    >
                      Edit
                    </button>

                    <button
                      className="delete-btn"
                      onClick={() => deleteSchool(s._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {!filteredSchools.length && !loading && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center" }}>
                    No high schools found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL */}
        {modalOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>{editSchool ? "Edit High School" : "Add High School"}</h3>

              <form onSubmit={saveSchool}>
                <input
                  placeholder="School Name"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  required
                />

                <input
                  placeholder="County"
                  value={form.county}
                  onChange={(e) =>
                    setForm({ ...form, county: e.target.value })
                  }
                />

                <input
                  placeholder="Location"
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                />

                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm({ ...form, isActive: e.target.checked })
                    }
                  />
                  Active
                </label>

                <div className="modal-actions">
                  <button className="save-btn">Save</button>
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
