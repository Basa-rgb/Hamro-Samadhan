import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ScrollToTop from "./ScrollToTop";

// Chrome for the public site. Wrapping the public routes in this keeps the
// citizen Navbar and Footer from being rendered around the admin area, which
// has its own layout in component/admin/AdminLayout.jsx
const PublicLayout = () => (
  <>
    <ScrollToTop />

    <Navbar />

    <Outlet />

    <Footer />
  </>
);

export default PublicLayout;
