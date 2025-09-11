import React, { useState } from "react";
import axios from "axios";
import "../../styles/StudentDashboard.css";

export default function StudentDashboard() {
  const token = localStorage.getItem("token");
  const [profile, setProfile] = useState({
    admissionNo: "",
    course: "",
    year: "",
    institution: "",
    contact: "",
    photo: null,
  });
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setProfile({ ...profile, photo: file });
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      for (const key in profile) {
        formData.append(key, profile[key]);
      }

      const res = await axios.post(
        "http://localhost:5000/api/student/profile",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setMessage("Profile saved successfully!");
    } catch (err) {
      setMessage(err.response?.data?.message || "Error saving profile");
    }
  };

  return (
    <div className="dashboard-container">
      <h2>🎓 Student Dashboard</h2>
      <p>Welcome! Please complete your profile below.</p>

      {message && <p className="message">{message}</p>}

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="profile-photo">
          {preview ? (
            <img src={preview} alt="Profile Preview" />
          ) : (
            <div className="placeholder">Upload Photo</div>
          )}
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </div>

        <input
          type="text"
          name="admissionNo"
          placeholder="Admission Number"
          value={profile.admissionNo}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="course"
          placeholder="Course"
          value={profile.course}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="year"
          placeholder="Year of Study"
          value={profile.year}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="institution"
          placeholder="University / College / TVET"
          value={profile.institution}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="contact"
          placeholder="Contact Number"
          value={profile.contact}
          onChange={handleChange}
          required
        />

        <button type="submit">Save Profile</button>
      </form>
    </div>
  );
}
