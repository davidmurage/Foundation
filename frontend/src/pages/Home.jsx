// src/pages/Home.jsx
import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/Home.css";

export default function Home() {
  return (
    <>
      <Navbar />

      <div className="home">
        {/* =========================
            HERO SECTION
        ========================== */}
        <section className="hero">
          <div className="hero-inner">
            {/* Left text column */}
            <div className="hero-content">
              <span className="hero-kicker">KCB Foundation • Student Portal</span>
              <h1>
                The most transparent &amp; secure way
                <br />
                to manage your sponsorship.
              </h1>
              <p className="hero-text">
                Simplifying document uploads, performance tracking, and
                communication between KCB Foundation and sponsored students —
                in one modern portal.
              </p>

              <div className="hero-actions">
                <a href="/register" className="btn btn-primary">
                  Get Started
                </a>
                <a href="#about" className="btn btn-outline">
                  Learn More
                </a>
              </div>

              {/* Small pill row like in design (application / business / etc) */}
              <div className="hero-tags">
                <span>📄 Application</span>
                <span>📁 Documents</span>
                <span>📊 Performance</span>
                <span>🏫 Institutions</span>
              </div>
            </div>

            {/* Right image column */}
            <div className="hero-image-wrapper">
              <div className="hero-image" />
            </div>
          </div>
        </section>

        {/* =========================
            FEATURE GRID SECTION
        ========================== */}
        <section className="features-section" id="get-started">
          <div className="features-header">
            <div>
              <h2>We are the next gen sponsorship experience</h2>
              <p>
                Manage your scholarship journey with real-time visibility into
                documents, fees, and academic performance. Built for students,
                schools, and the KCB Foundation team.
              </p>
            </div>
          </div>

          <div className="features-grid">
            {/* Big left card */}
            <article className="feature-card feature-main">
              <div className="feature-overlay" />
              <div className="feature-main-content">
                <h3>World-class support</h3>
                <p>
                  Stay connected with the Foundation team through clear
                  requirements, alerts, and verified information about your
                  sponsorship.
                </p>
              </div>
            </article>

            {/* Tall app card */}
            <article className="feature-card feature-app">
              <h3>Mobile-friendly portal</h3>
              <p>
                Access your profile, upload documents, and monitor your
                performance from any device — phone, tablet, or laptop.
              </p>
              <div className="app-mock">
                <div className="app-balance">GPA: 4.12</div>
                <div className="app-chart" />
                <div className="app-footer">Updated this semester</div>
              </div>
            </article>

            {/* Crypto-style tile → document types */}
            <article className="feature-card feature-docs">
              <h3>All key documents</h3>
              <p>
                Upload and manage fee structures, statements, transcripts, and
                department letters in one secure place.
              </p>
              <ul>
                <li>Fee structure</li>
                <li>Fee statement</li>
                <li>Transcripts</li>
                <li>Letters &amp; confirmations</li>
              </ul>
            </article>

            {/* Earnings tile → performance analytics */}
            <article className="feature-card feature-performance">
              <h3>Performance reports</h3>
              <p>
                Track GPA trends across years and semesters with simple,
                visual summaries aligned to sponsor requirements.
              </p>
              <div className="mini-graph">
                <span className="mini-label">GPA trend</span>
                <div className="mini-line" />
              </div>
            </article>

            {/* Bright green CTA card */}
            <article className="feature-card feature-cta">
              <h3>Create your portal account today</h3>
              <p>
                Start by registering with your KCB scholarship details, then
                set up your profile and upload your first documents.
              </p>
              <a href="/register" className="btn btn-full">
                Get started as a student →
              </a>
            </article>
          </div>
        </section>

        {/* =========================
            WHY CHOOSE SECTION
        ========================== */}
        <section className="why-section" id="about">
          <div className="why-inner">
            <div className="why-text">
              <h2>Why you should use the KCB Foundation Student Portal</h2>
              <p>
                The portal reduces paperwork, improves transparency, and keeps
                students, institutions, and the Foundation aligned. No more
                guessing which document is missing or whether your performance
                meets sponsorship requirements.
              </p>

              <ul className="why-list">
                <li>✔ Centralized document management</li>
                <li>✔ Real-time performance tracking</li>
                <li>✔ Clear communication with the Foundation</li>
                <li>✔ Secure and accessible from anywhere</li>
              </ul>
            </div>

            <div className="why-image-container">
              <div className="why-image" />
              <div className="why-badge">01</div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}
