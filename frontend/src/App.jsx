import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
//import About from "./pages/About";
import Register from "./pages/Register";
import Login from "./pages/Login";
import StudentDashboard from "./pages/students/StudentDashboard";
import ProtectedRoute from "./components/ProtectedRoutes";
import StudentProfileSetup from "./pages/students/StudentProfileSetup";
import Documents from "./pages/students/Documents";
import Performance from "./pages/students/Performance";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminStudentDetail from "./pages/admin/AdminStudentDetail";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminLayout from "./components/admin/AdminLayout";
import AdminInstitutions from "./pages/admin/AdminInstitutions";
import AdminInstitutionDetail from "./pages/admin/AdminInstitutionDetail";
import AdminSettings from "./pages/admin/AdminSettings";



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

        <Route
  path="/admin-dashboard"
  element={
    <ProtectedRoute role="admin">
      <AdminLayout />
    </ProtectedRoute>
  }
>
  {/* Default page when admin hits /admin-dashboard 
  <Route index element={<AdminStudents />} />*/}

  {/* List of students */}
  <Route path="students" element={<AdminStudents />} />

  {/* Detail page for one student */}
  <Route path="students/:userId" element={<AdminStudentDetail />} />

  {/* Admin overview*/}
  <Route path="overview" element={<AdminOverview/>}/>

  {/* list of Admin*/}
  <Route path="admin-users" element={<AdminUsers/>}/>

  {/* list of institutions*/}
  <Route path="institutions" element={<AdminInstitutions/>}/>

  {/* Institutions details*/}
  <Route path="institutions/:id" element={<AdminInstitutionDetail/>}/>

  {/* Settings*/}
  <Route path="settings" element={<AdminSettings/>}/>
</Route>
      </Routes>
    </>
  );
}

export default App;
