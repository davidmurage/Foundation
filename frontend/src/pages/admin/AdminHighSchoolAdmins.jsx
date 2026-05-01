import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_URL } from "../../utils/config";

import AdminSidebar from "../../components/admin/AdminSidebar";
import "../../styles/admin/AdminLayoutBase.css";
import "../../styles/admin/AdminHighSchoolAdmins.css";
import { useNavigate } from "react-router-dom";

export default function AdminHighSchoolAdmins() {
  const token = localStorage.getItem("token");

  const [schools, setSchools] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);

const [editForm, setEditForm] = useState({
  fullName: "",
  role: "Principal",
  institutionId: "",
});

  const [form, setForm] = useState({
    institutionId: "",
    fullName: "",
    contact: "",
    email: "",
    schoolContact: "",
    password: "",
    role: "Principal",
  });

  const [filters, setFilters] = useState({
  search: "",
  role: "",
  institutionId: "",
  status: "",
  });

  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);



  const navigate = useNavigate();

  /* ================= LOAD DATA ================= */
  const loadHighSchools = async () => {
    const res = await axios.get(
      `${API_URL}/api/institutions?type=HighSchool`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setSchools(res.data || []);
  };

  const loadAdmins = async () => {
    setLoading(true);
    const res = await axios.get(
      `${API_URL}/api/highschools/admins`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log("HS ADMINS:", res.data);
    setAdmins(res.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadHighSchools();
    loadAdmins();
    // eslint-disable-next-line
  }, []);

  const openEditModal = (admin) => {
  setEditingAdmin(admin);
  setEditForm({
    fullName: admin.user.fullName,
    role: admin.role,
    institutionId: admin.institution._id,
  });
  setEditModalOpen(true);
  };

  const submitEdit = async (e) => {
  e.preventDefault();
  try {
    await axios.put(
      `${API_URL}/api/highschools/admins/${editingAdmin._id}`,
      editForm,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    alert("Admin updated successfully");
    setEditModalOpen(false);
    loadAdmins();
  } catch (err) {
    alert(err.response?.data?.message || "Update failed");
  }
};


  const toggleAdmin = async (id) => {
  if (!window.confirm("Change admin status?")) return;
  await axios.patch(
    `${API_URL}/api/highschools/admins/${id}/toggle`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  loadAdmins();
};

const deleteAdmin = async (id) => {
  if (!window.confirm("Delete this admin permanently?")) return;
  await axios.delete(
    `${API_URL}/api/highschools/admins/${id}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  loadAdmins();
};


  /* ================= CREATE ADMIN ================= */
  const submit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API_URL}/api/highschools/create-admin`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("High school admin created");

      setModalOpen(false);
      setForm({
        institutionId: "",
        fullName: "",
        contact: "",
        email: "",
        schoolContact: "",
        password: "",
        role: "Principal",
      });

      loadAdmins();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create admin");
    }
  };

  const filteredAdmins = useMemo(() => {
  return admins.filter((a) => {
    const searchOk =
      !filters.search ||
      a.user?.fullName?.toLowerCase().includes(filters.search.toLowerCase()) ||
      a.user?.email?.toLowerCase().includes(filters.search.toLowerCase());

    const roleOk = !filters.role || a.role === filters.role;

    const schoolOk =
      !filters.institutionId || a.institution?._id === filters.institutionId;

    const statusOk =
      !filters.status ||
      (filters.status === "active" && a.isActive) ||
      (filters.status === "inactive" && !a.isActive);

    return searchOk && roleOk && schoolOk && statusOk;
  });
}, [admins, filters]);

//Pagination
const totalPages = Math.ceil(filteredAdmins.length / ITEMS_PER_PAGE);

const paginatedAdmins = useMemo(() => {
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  return filteredAdmins.slice(start, end);
}, [filteredAdmins, currentPage]);


useEffect(() => {
  setCurrentPage(1);
}, [filters]);



  return (
    <div className="admin-layout-wrapper">
      <AdminSidebar />

      <main className="admin-main-content">
        {/* HEADER */}
        <div className="hs-admin-header">
          <h2>🏫 High School Admin Accounts</h2>
          <button className="add-btn" onClick={() => setModalOpen(true)}>
            + Create Admin
          </button>
        </div>
        <div className="filters-bar">
  <input
    type="text"
    placeholder="Search name or email..."
    value={filters.search}
    onChange={(e) =>
      setFilters({ ...filters, search: e.target.value })
    }
  />

  <select
    value={filters.role}
    onChange={(e) =>
      setFilters({ ...filters, role: e.target.value })
    }
  >
    <option value="">All Roles</option>
    <option value="Principal">Principal</option>
    <option value="AcademicMaster">Academic Master</option>
  </select>

  <select
    value={filters.institutionId}
    onChange={(e) =>
      setFilters({ ...filters, institutionId: e.target.value })
    }
  >
    <option value="">All Schools</option>
    {schools.map((s) => (
      <option key={s._id} value={s._id}>
        {s.name}
      </option>
    ))}
  </select>

  <select
    value={filters.status}
    onChange={(e) =>
      setFilters({ ...filters, status: e.target.value })
    }
  >
    <option value="">All Status</option>
    <option value="active">Active</option>
    <option value="inactive">Inactive</option>
  </select>

  <button
    className="clear-btn"
    onClick={() =>
      setFilters({
        search: "",
        role: "",
        institutionId: "",
        status: "",
      })
    }
  >
    Clear
  </button>
</div>


        {/* TABLE */}
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>High School</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
  {paginatedAdmins.map((a) => (
    <tr key={a._id}>
      <td>{a.user?.fullName}</td>
      <td>{a.user?.email}</td>
      <td>
        <span className="badge">{a.role}</span>
      </td>
      <td>{a.institution?.name}</td>

      <td>
        <span className={a.isActive ? "badge badge-active" : "badge badge-inactive"}>
          {a.isActive ? "Active" : "Inactive"}
        </span>
      </td>

      <td className="actions-cell">
        <button
    className="profile-btn"
    onClick={() => navigate(`/admin-dashboard/highschools/${a.institution?._id}/profile`)}
  >
    Profile
  </button>
  <button className="edit-btn" onClick={() => openEditModal(a)}>
    Edit
  </button>

  <button
    className="toggle-btn"
    onClick={() => toggleAdmin(a._id)}
  >
    {a.isActive ? "Deactivate" : "Activate"}
  </button>

  <button
    className="delete-btn"
    onClick={() => deleteAdmin(a._id)}
  >
    Delete
  </button>
</td>
    </tr>
  ))}
</tbody>


          </table>

          {totalPages > 1 && (
  <div className="pagination">
    <button
      disabled={currentPage === 1}
      onClick={() => setCurrentPage((p) => p - 1)}
    >
      Prev
    </button>

    {Array.from({ length: totalPages }).map((_, i) => (
      <button
        key={i}
        className={currentPage === i + 1 ? "active" : ""}
        onClick={() => setCurrentPage(i + 1)}
      >
        {i + 1}
      </button>
    ))}

    <button
      disabled={currentPage === totalPages}
      onClick={() => setCurrentPage((p) => p + 1)}
    >
      Next
    </button>
  </div>
)}

        </div>

        {/* ================= MODAL ================= */}
{modalOpen && (
  <div className="modal-overlay">
    <div className="modal modal-scroll">
      <h3>Create High School Admin</h3>

      <form onSubmit={submit} className="hs-admin-form">

        <div className="form-group full-width">
          <label>High School</label>
          <select
            value={form.institutionId}
            onChange={(e) =>
              setForm({ ...form, institutionId: e.target.value })
            }
            required
          >
            <option value="">Select High School</option>
            {schools.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Teacher's Full Name</label>
          <input
            type="text"
            value={form.fullName}
            onChange={(e) =>
              setForm({ ...form, fullName: e.target.value })
            }
            required
          />
        </div>

        <div className="form-group">
          <label>Teacher's Contact</label>
          <input
            type="text"
            value={form.contact}
            onChange={(e) =>
              setForm({ ...form, contact: e.target.value })
            }
            required
          />
        </div>

        <div className="form-group">
          <label>School Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            required
          />
        </div>

        <div className="form-group">
          <label>School Contact</label>
          <input
            type="text"
            value={form.schoolContact}
            onChange={(e) =>
              setForm({ ...form, schoolContact: e.target.value })
            }
            required
          />
        </div>

        <div className="form-group full-width">
          <label>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
            required
          />
        </div>

        <div className="form-group full-width">
          <label>Role</label>
          <select
            value={form.role}
            onChange={(e) =>
              setForm({ ...form, role: e.target.value })
            }
          >
            <option value="Principal">Principal</option>
            <option value="AcademicMaster">Academic Master</option>
          </select>
        </div>

        <div className="modal-actions full-width">
          <button type="submit" className="save-btn">
            Create
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

     {/* Modal for Edits */}
        {editModalOpen && (
  <div className="modal-overlay">
    <div className="modal modal-scroll">
      <h3>Edit High School Admin</h3>

      <form onSubmit={submitEdit} className="hs-admin-form">
        <label>Full Name</label>
        <input
          type="text"
          value={editForm.fullName}
          onChange={(e) =>
            setEditForm({ ...editForm, fullName: e.target.value })
          }
          required
        />

        <label>Role</label>
        <select
          value={editForm.role}
          onChange={(e) =>
            setEditForm({ ...editForm, role: e.target.value })
          }
        >
          <option value="Principal">Principal</option>
          <option value="AcademicMaster">Academic Master</option>
        </select>

        <label>High School</label>
        <select
          value={editForm.institutionId}
          onChange={(e) =>
            setEditForm({
              ...editForm,
              institutionId: e.target.value,
            })
          }
          required
        >
          {schools.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>

        <div className="modal-actions">
          <button type="submit" className="save-btn">
            Save Changes
          </button>
          <button
            type="button"
            className="cancel-btn"
            onClick={() => setEditModalOpen(false)}
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
