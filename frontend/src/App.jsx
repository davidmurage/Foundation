import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
//import About from "./pages/About";
import Register from "./pages/Register";
import Login from "./pages/Login";
import StudentDashboard from "./pages/students/StudentDashboard";
import FeesApplication from "./pages/students/FeesApplication";
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
import AboutUs from "./pages/AboutUs";
import ForgotPassword from "./pages/ForgotPassword";

//highschool
import AdminHighSchools from "./pages/admin/AdminHighSchools";
import AdminHighSchoolAdmins from "./pages/admin/AdminHighSchoolAdmins";
import HighSchoolDashboard from "./pages/highschool/HighSchoolDashboard";
import HighSchoolStudents from "./pages/highschool/HighSchoolStudents";
import HighSchoolStudentProfile from "./pages/highschool/HighSchoolStudentProfile";
import AdminHighSchoolProfile from "./pages/admin/AdminHighSchoolProfile";
import AdminStudentProfile from "./pages/admin/AdminStudentProfile";
import AdminInstitutionReports from "./pages/admin/AdminInstitutionReports";
import AdminReportView from "./pages/admin/AdminReportView";
import AdminSystemShell from "./pages/admin/AdminSystemShell";
import VerifyOtp from "./pages/VerifyOtp";
import ResetPassword from "./pages/ResetPassword";





function App() {
  return (
    <>
    <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        {/*<Route path="/about" element={<About />} />*/}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/about" element={<AboutUs/>}/>
        <Route path="/forgot-password" element={<ForgotPassword/>}/>
        <Route path="/reset-password" element={<ResetPassword/>}/>
        <Route path="/verify-otp" element={<VerifyOtp />} />


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
          path="/fees"
          element={
            <ProtectedRoute role="student">
              <FeesApplication/>
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
  <Route path="reports/institutions" element={<AdminInstitutionReports />} />
  <Route path="reports/:reportId" element={<AdminReportView />} />

  {/*HighSchools*/}
  <Route path="highschools" element={<AdminHighSchools/>}/>

  

  <Route
  path="highschool-admins"
  element={<AdminHighSchoolAdmins />}
/>

<Route path="highschools/:schoolId/profile" element={<AdminHighSchoolProfile />}/>
<Route path="highschools/:schoolId/students/:studentId" element={<AdminStudentProfile />} />


  {/* Settings*/}
  <Route path="settings" element={<AdminSettings/>}/>
  <Route path="shell" element={<AdminSystemShell/>}/>
</Route>

{/*HighSchool*/}
{/* ================= HIGH SCHOOL ================= */}
        <Route
          path="/hs-dashboard/overview"
          element={
            <ProtectedRoute role="highschool_admin">
              <HighSchoolDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hs-dashboard/students"
          element={
            <ProtectedRoute role="highschool_admin">
              <HighSchoolStudents />
            </ProtectedRoute>
          }
        />

         
        <Route path="/hs-dashboard/students/:id" element={<HighSchoolStudentProfile />} />

        <Route
          path="/highschools/:schoolId/profile"
          element={
            
              <AdminHighSchoolProfile />
            
          }
        />
        

      </Routes>
    </>
  );
}

export default App;
