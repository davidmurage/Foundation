import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/AboutUs.css";

export default function AboutUs() {
  return (
    <>
      {/* NAVBAR */}
      <Navbar />

      <div className="about-container">
        {/* TOP SECTION */}
        <section className="about-header">
          <h4>ABOUT US</h4>
          <h1>Unveiling Our Identity,<br /> Vision and Values</h1>
          <p>
            KCB Foundation is committed to empowering young people through education,
            financial inclusion, innovation, and community development. With decades
            of impact across Kenya and East Africa, we continue shaping a secure and
            sustainable future.
          </p>
        </section>

        {/* VALUES BAR */}
        <div className="values-bar">
          <div className="value-item">
            <span className="icon">🛡️</span>
            <p>Integrity</p>
          </div>
          <div className="value-item">
            <span className="icon">⚡</span>
            <p>Efficiency</p>
          </div>
          <div className="value-item">
            <span className="icon">🎯</span>
            <p>Impact</p>
          </div>
          <div className="value-item">
            <span className="icon">💡</span>
            <p>Innovation</p>
          </div>
        </div>

        {/* VISION + MISSION */}
        <div className="vision-mission-card">
          <div className="vm-column">
            <h3>🌱 Vision</h3>
            <p>
              To be a transformative force across Africa by enabling equal opportunities
              and empowering communities through education, enterprise development,
              and sustainable social programs.
            </p>
          </div>

          <div className="divider"></div>

          <div className="vm-column">
            <h3>🎓 Mission</h3>
            <p>
              To equip young people with the resources, skills, and support they need
              to thrive academically, socially, and economically — breaking cycles of
              poverty and creating lasting change.
            </p>
          </div>
        </div>

        <div className="learn-more-section">
          <a href="/about" className="learn-more-btn">Learn More About KCB Foundation</a>
        </div>
      </div>

      {/* FOOTER */}
      <Footer />
    </>
  );
}
