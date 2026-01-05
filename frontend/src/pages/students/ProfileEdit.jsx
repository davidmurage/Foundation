import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../../utils/config";
import "../../styles/student/ProfileEdit.css"

export default function ProfileEdit({ setActiveTab }) {
  const token = localStorage.getItem("token");
  const [profile, setProfile] = useState({
  admissionNo: "",
  course: "",
  year: "",
  academicPeriod: "",
  institution: "",
  contact: "",
  photo: null,
});
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [institutions, setInstitutions] = useState([]);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/student/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data) {
          setProfile({
  admissionNo: res.data.admissionNo,
  course: res.data.course,
  year: res.data.year,
  academicPeriod: res.data.academicPeriod,
  institution: res.data.institution?._id || "",
  contact: res.data.contact,
  photo: null,
});
          setPreview(res.data.photo);
        }
      });
  }, [token]);

  useEffect(() => {
  axios.get(`${API_URL}/api/institutions`).then((res) => {
    setInstitutions(res.data || []);
  });
}, []);


  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setProfile({ ...profile, photo: file });
    if (file) setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const formData = new FormData();

    // append ONLY what backend expects
    formData.append("admissionNo", profile.admissionNo);
    formData.append("course", profile.course);
    formData.append("year", profile.year);
    formData.append("academicPeriod", profile.academicPeriod);
    formData.append("institution", profile.institution); // ObjectId ONLY
    formData.append("contact", profile.contact);

    if (profile.photo) {
      formData.append("photo", profile.photo);
    }

    await axios.post(`${API_URL}/api/student/profile`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    setMessage("Profile updated successfully!");
    setTimeout(() => setActiveTab("profile"), 1000);
  } catch (err) {
    setMessage(err.response?.data?.message || "Error updating profile");
  }
};


  return (
    <div className="profile-edit">
      <h2>✏️ Edit Profile</h2>
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

        <select name="year" value={profile.year} onChange={handleChange} required>
          <option value="">Select Year of Study</option>
          <option value="1">Year 1</option>
          <option value="2">Year 2</option>
          <option value="3">Year 3</option>
          <option value="4">Year 4</option>
          <option value="5">Year 5</option>
        </select>

        

        <select
          name="institution"
          value={profile.institution}
          onChange={(e) =>
          setProfile({
          ...profile,
          institution: e.target.value,
          institutionName:
          institutions.find((i) => i._id === e.target.value)?.name || "",
          })
          }
          required
        >
          <option value="">Select Institution</option>
          {institutions.map((inst) => (
          <option key={inst._id} value={inst._id}>
          {inst.name}
          </option>
          ))}
        </select>

        <input
          type="text"
          name="contact"
          placeholder="Contact Number"
          value={profile.contact}
          onChange={handleChange}
          required
        />

        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
}
