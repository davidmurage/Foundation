import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../../utils/config";
import "../../styles/student/ProfileView.css";
<<<<<<< HEAD
=======
import ChatWidget from "../../components/ChatWidget";
>>>>>>> Chats

export default function ProfileView({ setActiveTab }) {
  const token = localStorage.getItem("token");
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/student/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setProfile(res.data))
      .catch(() => setProfile(null));
  }, [token]);

  if (!profile) {
    return <p>No profile found. Please set up your profile.</p>;
  }

  return (
    <div className="profile-view">
      <h2>👤 My Profile</h2>
      <div className="profile-card">
        <img src={profile.photo} alt="Profile" />
        <div>
          <p><strong>Admission No:</strong> {profile.admissionNo}</p>
          <p><strong>Course:</strong> {profile.course}</p>
          <p><strong>Year:</strong> {profile.year}</p>
          <p><strong>academicPeriod:</strong>{profile.academicPeriod}</p>
          <p><strong>Institution:</strong> {profile.institutionName}</p>
          <p><strong>Contact:</strong> {profile.contact}</p>
        </div>
      </div>
      <button onClick={() => setActiveTab("profile-edit")}>Edit Profile</button>
<<<<<<< HEAD
=======

      <ChatWidget/>
>>>>>>> Chats
    </div>
  );
}
