import React, { useEffect, useState } from "react";
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
    email: "",
    password: "",
    role: "Principal",
  });

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
        email: "",
        password: "",
        role: "Principal",
      });

      loadAdmins();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create admin");
    }
  };

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
  {admins.map((a) => (
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
        </div>

        {/* ================= MODAL ================= */}
        {modalOpen && (
          <div className="modal-overlay">
            <div className="modal modal-scroll">
              <h3>Create High School Admin</h3>

              <form onSubmit={submit} className="hs-admin-form">
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

                <label>Full Name</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({ ...form, fullName: e.target.value })
                  }
                  required
                />

                <label>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  required
                />

                <label>Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                />

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

                <div className="modal-actions">
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
