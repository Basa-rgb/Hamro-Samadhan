import { createContext } from "react";

// Kept in its own module so AuthProvider.jsx only exports a component, which
// is what keeps React Fast Refresh working on the login page
//
// status is one of:
//   "loading"      the session is still being checked, show a spinner
//   "authenticated" there is a live session
//   "anonymous"    no session, the admin has to sign in
export const AuthContext = createContext(null);