import React from "react";
import "../styles/Home.css";

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <h1>Welcome to KCB Foundation Student Portal</h1>
        <p>
          Simplifying document uploads and performance monitoring for
          sponsored students.
        </p>
        <a href="#get-started" className="hero-btn">Get Started</a>
      </section>

      <section id="about" className="about">
        <h2>About Us</h2>
        <p>
          The KCB Foundation empowers students by providing scholarships and
          academic support. This system ensures seamless document submission
          and monitoring, making sponsorship management efficient and transparent.
        </p>
      </section>

      <section id="get-started" className="get-started-section">
        <h2>Get Started</h2>
        <p>Create your profile, upload documents, and track your performance.</p>
        <a href="/register" className="get-started-link">Create Profile</a>
      </section>
    </div>
  );
}
