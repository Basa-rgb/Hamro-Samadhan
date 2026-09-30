import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../Hooks/useAuth";
import { Spinner } from "./ui";

// Blocks the whole admin area until the session is known to be good.
//
// While the session is still being checked the spinner is shown rather than a
// redirect, otherwise a refresh on any admin page would bounce a signed-in
// admin to the login screen for a moment.
const ProtectedRoute = () => {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center gap-3 text-gray-500">
        <Spinner />

        <span className="text-sm">Checking your session...</span>
      </div>
    );
  }

  if (status === "anonymous") {
    // state carries where the admin was heading, so they land back there
    // after signing in instead of on the dashboard
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
