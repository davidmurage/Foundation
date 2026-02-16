// src/pages/admin/AdminUsers.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../utils/config";

import AdminSidebar from "../../components/admin/AdminSidebar";
import "../../styles/admin/AdminLayoutBase.css"; 
import "../../styles/admin/AdminUsers.css";

export default function AdminUsers() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdmins(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setForm({ fullName: "", email: "", password: "" });
    setEditMode(false);
    setModalOpen(true);
  };

  const openEditModal = (admin) => {
    setForm({
      fullName: admin.fullName,
      email: admin.email,
      password: "",
    });
    setSelectedAdmin(admin);
    setEditMode(true);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editMode) {
        await axios.put(
          `${API_URL}/api/admin/${selectedAdmin._id}`,
          form,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(`${API_URL}/api/admin`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setModalOpen(false);
      loadAdmins();
    } catch (err) {
      console.error(err);
      alert("Error saving admin user");
    }
  };

  const deleteAdmin = async (id) => {
    if (!window.confirm("Delete this admin?")) return;

    try {
      await axios.delete(`${API_URL}/api/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      loadAdmins();
    } catch (err) {
      console.error(err);
      alert("Error deleting admin");
    }
  };

  if (loading)
    return (
      <div className="admin-layout-wrapper">
        <AdminSidebar />
        <main className="admin-main-content">Loading...</main>
      </div>
    );

  return (
    <div className="admin-layout-wrapper">
      <AdminSidebar />

      <main className="admin-main-content">
        <div className="admin-users-header">
          <h2>Admin Users</h2>
          <button className="add-btn" onClick={openAddModal}>
            + Add Admin
          </button>
        </div>

        <div className="table-wrapper">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {admins.map((admin) => (
                <tr key={admin._id}>
                  <td>{admin.fullName}</td>
                  <td>{admin.email}</td>
                  <td className="actions-cell">
                    <button className="edit-btn" onClick={() => openEditModal(admin)}>
                      Edit
                    </button>
                    <button className="delete-btn" onClick={() => deleteAdmin(admin._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {modalOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>{editMode ? "Edit Admin" : "Add Admin"}</h3>

              <form onSubmit={handleSubmit}>
                <label>Full Name</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  required
                />

                <label>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />

                {!editMode && (
                  <>
                    <label>Password</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                    />
                  </>
                )}

                <div className="modal-actions">
                  <button type="submit" className="save-btn">Save</button>
                  <button type="button" className="cancel-btn" onClick={() => setModalOpen(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
