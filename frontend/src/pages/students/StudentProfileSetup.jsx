import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/StudentDashboard.css";
import { API_URL } from "../../utils/config";

export default function StudentProfileSetup() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

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

      await axios.post(`${API_URL}}/api/student/profile`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      navigate("/student-dashboard"); // redirect after success
    } catch (err) {
      setMessage(err.response?.data?.message || "Error saving profile");
    }
  };

  return (
    <div className="dashboard-container">
      <h2>🎓 Complete Your Profile</h2>
      <p>Please provide your details before continuing.</p>
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

        {/* Year Dropdown */}
        <select name="year" value={profile.year} onChange={handleChange} required>
          <option value="">Select Year of Study</option>
          <option value="1">Year 1</option>
          <option value="2">Year 2</option>
          <option value="3">Year 3</option>
          <option value="4">Year 4</option>
          <option value="5">Year 5</option>
        </select>

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
