import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
//import About from "./pages/About";
import Register from "./pages/Register";
import Login from "./pages/Login";
import StudentDashboard from "./pages/students/StudentDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoutes";
import StudentProfileSetup from "./pages/students/StudentProfileSetup";
import Documents from "./pages/students/Documents";
import Performance from "./pages/students/Performance";


function App() {
  return (
    <>
    <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        {/*<Route path="/about" element={<About />} />*/}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Student Routes */}
        <Route
          path="/profile-setup"
          element={
            <ProtectedRoute role="student">
              <StudentProfileSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/documents"
          element={
            <ProtectedRoute role="student">
              <Documents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/performance"
          element={
            <ProtectedRoute role="student">
              <Performance />
            </ProtectedRoute>
          }
        />

        {/* Admin Route */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
