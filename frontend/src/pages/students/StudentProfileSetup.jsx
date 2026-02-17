import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/student/StudentProfileSetup.css";
import { API_URL } from "../../utils/config";
import ChatWidget from "../../components/ChatWidget";

export default function StudentProfileSetup() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    admissionNo: "",
    course: "",
    year: "",
    institutionType: "",
    institution: "",
    academicPeriod: "",
    contact: "",
    photo: null,
  });

  const [institutions, setInstitutions] = useState([]);
  const [instLoading, setInstLoading] = useState(false);
  const [instError, setInstError] = useState("");

  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState("");

  const [instSearch, setInstSearch] = useState("");
  const [showInstList, setShowInstList] = useState(false);


  // ---------------------------
  // LOAD INSTITUTIONS FROM DB
  // ---------------------------
  useEffect(() => {
    const loadInstitutions = async () => {
      if (!profile.institutionType) {
        setInstitutions([]);
        setInstError("");
        return;
      }

      setInstLoading(true);
      setInstError("");

      try {
        const url = `${API_URL}/api/institutions`;
        const res = await axios.get(url, {
          params: { type: profile.institutionType }, // University | TVET
        });

        console.log("Institutions API response:", res.data);

        if (Array.isArray(res.data)) {
          setInstitutions(res.data);
        } else {
          setInstitutions([]);
          setInstError("Institutions endpoint did not return an array.");
        }
      } catch (err) {
        console.error("INSTITUTION LOAD ERROR:", err);
        setInstitutions([]);

        const status = err.response?.status;
        const data = err.response?.data;

        setInstError(
          status
            ? `Failed to load institutions (HTTP ${status}). Check backend route /api/institutions.`
            : "Failed to load institutions. Check server is running and CORS."
        );

        console.log("Institutions error response:", data);
      } finally {
        setInstLoading(false);
      }
    };

    loadInstitutions();
  }, [profile.institutionType]);

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
    setMessage("");

    try {
      const formData = new FormData();
      Object.entries(profile).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          formData.append(key, value);
        }
      });

      await axios.post(`${API_URL}/api/student/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      navigate("/student-dashboard");
    } catch (err) {
      console.error("PROFILE ERROR:", err.response?.data || err.message);
      setMessage(err.response?.data?.message || "Failed to save profile");
    }
  };

  const academicPeriods =
    profile.institutionType === "University"
      ? ["Semester 1", "Semester 2"]
      : profile.institutionType === "TVET"
      ? ["Term 1", "Term 2", "Term 3"]
      : [];

  const filteredInstitutions = institutions.filter((inst) =>
  inst.name.toLowerCase().includes(instSearch.toLowerCase())
  );


  return (
    <div className="dashboard-container">
      <h2>🎓 Complete Your Profile</h2>

      {message && <p className="message">{message}</p>}

      <form onSubmit={handleSubmit} className="profile-form">
        {/* PHOTO */}
        <div className="profile-photo">
          {preview ? (
            <img src={preview} alt="Preview" />
          ) : (
            <div className="placeholder">Upload Photo</div>
          )}
          <input type="file" accept="image/*" onChange={handleFileChange} />
        </div>

        <input
          name="admissionNo"
          placeholder="Admission Number"
          value={profile.admissionNo}
          onChange={handleChange}
          required
        />

        <input
          name="course"
          placeholder="Course"
          value={profile.course}
          onChange={handleChange}
          required
        />

        {/* INSTITUTION TYPE */}
        <select
          name="institutionType"
          value={profile.institutionType}
          onChange={(e) =>
            setProfile({
              ...profile,
              institutionType: e.target.value,
              institution: "",
              academicPeriod: "",
            })
          }
          required
        >
          <option value="">Select Institution Type</option>
          <option value="University">University</option>
          <option value="TVET">TVET / College</option>
        </select>

        {/* INSTITUTION NAME */}
        {profile.institutionType && (
          <>
            <div className="institution-search">
  <input
    type="text"
    placeholder={
      instLoading ? "Loading institutions..." : "Search institution..."
    }
    value={instSearch}
    onChange={(e) => {
      setInstSearch(e.target.value);
      setShowInstList(true);
    }}
    onFocus={() => setShowInstList(true)}
    disabled={instLoading}
    required
  />

  {showInstList && instSearch && (
    <div className="institution-dropdown">
      {filteredInstitutions.length > 0 ? (
        filteredInstitutions.map((inst) => (
          <div
            key={inst._id}
            className="institution-option"
            onClick={() => {
              setProfile({ ...profile, institution: inst._id });
              setInstSearch(inst.name);
              setShowInstList(false);
            }}
          >
            {inst.name}
          </div>
        ))
      ) : (
        <div className="institution-option disabled">
          No institutions found
        </div>
      )}
    </div>
  )}
</div>


            {instError && (
              <p className="message" style={{ color: "crimson" }}>
                {instError}
              </p>
            )}

            {!instLoading && !instError && institutions.length === 0 && (
              <p className="message" style={{ opacity: 0.8 }}>
                No institutions found for {profile.institutionType}. Add them in Admin → Institutions.
              </p>
            )}
          </>
        )}

        {/* YEAR */}
        <select name="year" value={profile.year} onChange={handleChange} required>
          <option value="">Year of Study</option>
          {[1, 2, 3, 4, 5].map((y) => (
            <option key={y} value={String(y)}>
              Year {y}
            </option>
          ))}
        </select>

        {/* ACADEMIC PERIOD */}
        {profile.institutionType && (
          <select
            name="academicPeriod"
            value={profile.academicPeriod}
            onChange={handleChange}
            required
          >
            <option value="">Select Academic Period</option>
            {academicPeriods.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        )}

        <input
          name="contact"
          placeholder="Contact Number"
          value={profile.contact}
          onChange={handleChange}
          required
        />

        <button type="submit">Save Profile</button>
      </form>
      <ChatWidget/>
    </div>
  );
}
