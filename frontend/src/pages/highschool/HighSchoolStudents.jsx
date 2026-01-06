import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../utils/config";


import "../../styles/highschool/HighSchoolStudents.css";
import HighSchoolSidebar from "../../components/HighSchool/HighSchoolSidebar";

export default function HighSchoolStudents() {
  const token = localStorage.getItem("token");

  const [students, setStudents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    registrationNo: "",
    gender: "",
    educationSystem: "CBC",
    grade: "",
    form: "",
  });

  const loadStudents = async () => {
    const res = await axios.get(`${API_URL}/api/highschool/students`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setStudents(res.data || []);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const submit = async (e) => {
    e.preventDefault();

    await axios.post(`${API_URL}/api/highschool/students`, form, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setModalOpen(false);
    setForm({
      fullName: "",
      registrationNo: "",
      gender: "",
      educationSystem: "CBC",
      grade: "",
      form: "",
    });

    loadStudents();
  };

  return (
    <div className="hs-layout">
      <HighSchoolSidebar />

      <main className="hs-main">
        <div className="hs-header">
          <h2>👨‍🎓 Sponsored Students</h2>
          <button onClick={() => setModalOpen(true)}>+ Add Student</button>
        </div>

        {/* TABLE */}
        <div className="table-wrapper">
          <table className="hs-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Gender</th>
                <th>System</th>
                <th>Grade / Form</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s._id}>
                  <td>{s.fullName}</td>
                  <td>{s.gender}</td>
                  <td>{s.educationSystem}</td>
                  <td>
                    {s.educationSystem === "CBC" ? s.grade : s.form}
                  </td>
                </tr>
              ))}

              {!students.length && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center" }}>
                    No students added yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL */}
        {modalOpen && (
          <div className="modal-overlay">
            <div className="modal modal-scroll">
              <h3>Add Student</h3>

              <form onSubmit={submit}>
                <input
                  placeholder="Full Name"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({ ...form, fullName: e.target.value })
                  }
                  required
                />

                <input
                  placeholder="Registration No"
                  value={form.registrationNo}
                  onChange={(e) =>
                    setForm({ ...form, registrationNo: e.target.value })
                  }
                />

                <select
                  value={form.gender}
                  onChange={(e) =>
                    setForm({ ...form, gender: e.target.value })
                  }
                  required
                >
                  <option value="">Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>

                <select
                  value={form.educationSystem}
                  onChange={(e) =>
                    setForm({ ...form, educationSystem: e.target.value })
                  }
                >
                  <option value="CBC">CBC</option>
                  <option value="844">8-4-4</option>
                </select>

                {form.educationSystem === "CBC" ? (
                  <input
                    placeholder="Grade (e.g Grade 7)"
                    value={form.grade}
                    onChange={(e) =>
                      setForm({ ...form, grade: e.target.value })
                    }
                    required
                  />
                ) : (
                  <select
                    value={form.form}
                    onChange={(e) =>
                      setForm({ ...form, form: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Form</option>
                    <option>Form 3</option>
                    <option>Form 4</option>
                  </select>
                )}

                <div className="modal-actions">
                  <button type="submit">Save</button>
                  <button type="button" onClick={() => setModalOpen(false)}>
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
