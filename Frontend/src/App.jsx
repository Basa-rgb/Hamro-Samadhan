import React from "react";
import { Routes, Route } from "react-router-dom";

import PublicLayout from "./component/PublicLayout";
import Home from "./pages/Home";
import Report from "./pages/Report";
import HowItWorks from "./pages/HowItWorks";
import About from "./pages/About";
import Guidelines from "./pages/Guidelines";
import Faq from "./pages/Faq";
import TrackReport from "./pages/TrackReport";

// Admin area. Every page below is inside the protected layout, which checks
// the session cookie before any of them render
import ProtectedRoute from "./component/admin/ProtectedRoute";
import AdminLayout from "./component/admin/AdminLayout";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminReports from "./pages/admin/AdminReports";
import AdminDepartments from "./pages/admin/AdminDepartments";

const App = () => {
  return (
    <Routes>
      {/* ==================== PUBLIC ==================== */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/report" element={<Report />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/about" element={<About />} />
        <Route path="/guidelines" element={<Guidelines />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/track" element={<TrackReport />} />
      </Route>

      {/* ==================== ADMIN ==================== */}
      {/* The login page sits outside the guard, otherwise a signed out admin
          could never reach it */}
      <Route path="/admin/login" element={<AdminLogin />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="departments" element={<AdminDepartments />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default App;
