import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../utils/config";


import "../../styles/highschool/HighSchoolStudents.css";
import HighSchoolSidebar from "../../components/HighSchool/HighSchoolSidebar.jsx";
import { useNavigate } from "react-router-dom";
import ChatWidget from "../../components/ChatWidget.jsx";

export default function HighSchoolStudents() {
  const token = localStorage.getItem("token");

  const [students, setStudents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
  fullName: "",
  registrationNo: "",
  gender: "",
  curriculum: "CBC",        // CBC or 844
  level: "",                // Grade / Form
  academicYear: "",
  term: "",
  feesAmount: "",
});

const [filters, setFilters] = useState({
  search: "",
  gender: "",
  curriculum: "",
  level: "",
  academicYear: "",
});

const [editingStudent, setEditingStudent] = useState(null);
const navigate = useNavigate();

const [currentPage, setCurrentPage] = useState(1);

const STUDENTS_PER_PAGE = 5;



  const loadStudents = async () => {
    const res = await axios.get(`${API_URL}/api/highschool/students`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setStudents(res.data || []);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const filteredStudents = students.filter((s) => {
  return (
    (!filters.search ||
      s.fullName.toLowerCase().includes(filters.search.toLowerCase())) &&
    (!filters.gender || s.gender === filters.gender) &&
    (!filters.curriculum || s.curriculum === filters.curriculum) &&
    (!filters.level || s.level === filters.level) &&
    (!filters.academicYear || s.academicYear === filters.academicYear)
  );
});

 // pagination calculations
const totalPages = Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE);

const paginatedStudents = filteredStudents.slice(
  (currentPage - 1) * STUDENTS_PER_PAGE,
  currentPage * STUDENTS_PER_PAGE
);

useEffect(() => {
  setCurrentPage(1);
}, [filters, students]);


  const submit = async (e) => {
  e.preventDefault();

  if (!form.academicYear || !form.term) {
    alert("Academic Year and Term are required");
    return;
  }

  try {
    if (editingStudent) {
      // UPDATE
      await axios.put(
        `${API_URL}/api/highschool/students/${editingStudent._id}`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } else {
      // CREATE
      await axios.post(
        `${API_URL}/api/highschool/students`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }

    setModalOpen(false);
    setEditingStudent(null);

    setForm({
      fullName: "",
      registrationNo: "",
      gender: "",
      curriculum: "CBC",
      level: "",
      academicYear: "",
      term: "",
      feesAmount: "",
    });

    loadStudents();
  } catch (err) {
    alert(err.response?.data?.message || "Failed");
  }
};

const handleDelete = async (id) => {
  if (!window.confirm("Are you sure you want to delete this student?")) return;

  try {
    await axios.delete(
      `${API_URL}/api/highschool/students/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    loadStudents();
  } catch (err) {
    alert("Failed to delete student");
  }
};


const handleEditOpen = (student) => {
  setForm({
    fullName: student.fullName,
    registrationNo: student.registrationNo,
    gender: student.gender,
    curriculum: student.curriculum,
    level: student.level,
    academicYear: student.academicYear,
    term: student.term,
    feesAmount: student.feesAmount,
  });

  setEditingStudent(student);
  setModalOpen(true);
};


const handleBulkUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  try {
    await axios.post(
      `${API_URL}/api/highschool/students/bulk`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    alert("Bulk import successful");
    loadStudents();
  } catch (err) {
    alert(err.response?.data?.message || "Bulk upload failed");
  }
};


  return (
    <div className="hs-layout">
      <HighSchoolSidebar />

      <main className="hs-main">

        <div className="hs-header">
            <h2>👨‍🎓 Sponsored Students</h2>
            <div className="filters-bar">
  <input
    placeholder="Search name..."
    value={filters.search}
    onChange={(e) =>
      setFilters({ ...filters, search: e.target.value })
    }
  />

  <select
    value={filters.gender}
    onChange={(e) =>
      setFilters({ ...filters, gender: e.target.value })
    }
  >
    <option value="">Gender</option>
    <option value="Male">Male</option>
    <option value="Female">Female</option>
  </select>

  <select
    value={filters.curriculum}
    onChange={(e) =>
      setFilters({ ...filters, curriculum: e.target.value })
    }
  >
    <option value="">System</option>
    <option value="CBC">CBC</option>
    <option value="844">8-4-4</option>
  </select>

  <input
    placeholder="Grade / Form"
    value={filters.level}
    onChange={(e) =>
      setFilters({ ...filters, level: e.target.value })
    }
  />

  <input
    placeholder="Year"
    value={filters.academicYear}
    onChange={(e) =>
      setFilters({ ...filters, academicYear: e.target.value })
    }
  />
</div>
          <label className="bulk-btn">
  📥 Bulk Import
  <input
    type="file"
    accept=".csv"
    hidden
    onChange={handleBulkUpload}
  />
</label>
          <button onClick={() => setModalOpen(true)}>+ Add Student</button>
        </div>

        {/* TABLE */}
        <div className="table-wrapper">
          <table className="hs-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>RegNo</th>
                <th>Gender</th>
                <th>System</th>
                <th>Grade / Form</th>
                <th>year</th>
                <th>Term</th>
                <th>Fees</th>
                <th>status</th>
                <th>Actions</th>

              </tr>
            </thead>
            <tbody>
  {paginatedStudents.map((s) => (
    <tr key={s._id}>
      <td>{s.fullName}</td>
      <td>{s.registrationNo || "—"}</td>
      <td>{s.gender}</td>
      <td>{s.curriculum}</td>
      <td>{s.level}</td>
      <td>{s.academicYear}</td>
      <td>{s.term}</td>
      <td>
        KES {Number(s.feesAmount).toLocaleString()}
      </td>
      <td>
        <span className={`status-badge ${s.sponsorshipStatus}`}>
          {s.sponsorshipStatus}
        </span>
      </td>
      <td className="actions-cell">
  <button
    className="btn-edit"
    onClick={() => handleEditOpen(s)}
  >
    ✏️ Edit
  </button>

  <button
    className="btn-delete"
    onClick={() => handleDelete(s._id)}
  >
    🗑 Delete
  </button>
  <button className="btn-view" onClick={() => navigate(`/hs-dashboard/students/${s._id}`)}>
    📄 Profile
  </button>
</td>
    </tr>
  ))}

  {!students.length && (
    <tr>
      <td colSpan={9} style={{ textAlign: "center" }}>
        No students added yet
      </td>
    </tr>
  )}
</tbody>

          </table>

{/* PAGINATION */}
{totalPages > 1 && (
  <div className="pagination">
    <button
      disabled={currentPage === 1}
      onClick={() => setCurrentPage((p) => p - 1)}
    >
      ◀ Prev
    </button>

    {[...Array(totalPages)].map((_, i) => (
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
      Next ▶
    </button>
  </div>
)}

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
                  value={form.curriculum}
                  onChange={(e) =>
                  setForm({ ...form, curriculum: e.target.value, level: "" })
                  }
                  required
                >
                 <option value="CBC">CBC</option>
                 <option value="844">8-4-4</option>
                </select>

                {form.curriculum === "CBC" ? (
                 <input
                    placeholder="Grade (e.g Grade 7)"
                    value={form.level}
                    onChange={(e) =>
                    setForm({ ...form, level: e.target.value })
                    }
                     required
                 />
                  ) : (
                 <select
                    value={form.level}
                    onChange={(e) =>
                    setForm({ ...form, level: e.target.value })
                    }
                     required
                 >
                    <option value="">Select Form</option>
                    <option value="Form 3">Form 3</option>
                    <option value="Form 4">Form 4</option>
                 </select>
                )}
                
                <input
                  placeholder="Academic Year (e.g 2025)"
                  value={form.academicYear}
                  onChange={(e) =>
                  setForm({ ...form, academicYear: e.target.value })
                  }
                  required
                />

                <select
                  value={form.term}
                  onChange={(e) =>
                  setForm({ ...form, term: e.target.value })
                  }
                   required
                >
                   <option value="">Select Term</option>
                   <option value="Term 1">Term 1</option>
                   <option value="Term 2">Term 2</option>
                   <option value="Term 3">Term 3</option>
                </select>


                <input
                  type="number"
                  placeholder="Fees Amount (KES)"
                  value={form.feesAmount}
                  onChange={(e) =>
                  setForm({ ...form, feesAmount: e.target.value })
                  }
                 required
                />

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
      <ChatWidget/>
    </div>
  );
}
