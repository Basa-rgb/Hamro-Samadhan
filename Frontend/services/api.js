import axios from "axios";

// Vite inlines import.meta.env at build time, so an unset VITE_API_URL does not
// fail the build, it silently leaves baseURL undefined and every request goes to
// the same origin the SPA is served from. That looks like a dead backend rather
// than a missing variable, so a build without the variable is caught here and
// said plainly in the console instead of failing quietly at runtime.
const baseURL = import.meta.env.VITE_API_URL;

if (!baseURL) {
  console.warn(
    "[api] VITE_API_URL is not set. Requests will go to the current origin. " +
      "Set it for Production, Preview and Development in the Vercel dashboard, " +
      "then redeploy — Vite bakes it in at build time.",
  );
}

const api = axios.create({
  baseURL,
  withCredentials: true,
});

// Sessions last 15 minutes, so a dashboard left open will eventually get a 401
// from any request. The handler is registered once by AuthProvider so the user
// is dropped back on the login page from anywhere, instead of every screen
// having to notice its own expired session
let onUnauthorized = null;

export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

// The login and logout calls fail with a 401 for reasons of their own, a wrong
// password or an already dead session, so they must not trigger the handler
const AUTH_ROUTES = ["/auth/login", "/auth/logout"];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";

    if (error.response?.status === 401 && !AUTH_ROUTES.includes(url)) {
      onUnauthorized?.();
    }

    return Promise.reject(error);
  },
);

export default api;