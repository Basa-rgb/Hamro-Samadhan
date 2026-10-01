const cors = require("cors");

// Origin the browser is served from, so the cookie is accepted
// Falls back to the Vite dev server, which is what local runs use
const allowedOrigin =
  process.env.CLIENT_URL || "http://localhost:5173";

// A browser sends the Origin header with no trailing slash, so a CLIENT_URL that
// ends in one can never match and every browser request gets refused, login
// included. Dropping the slash here means a copy pasted straight from a browser's
// address bar still works
const normalise = (value) =>
  value
    .trim()
    .replace(/\/+$/, "")
    .toLowerCase();

// A production deploy with no CLIENT_URL answers every browser request without
// an allow header, so the frontend gets blocked and the pages that depend on
// the API render empty, a dead dropdown rather than a CORS error. The requests
// still work from curl, which is what makes this easy to miss, so say so on
// boot where it is actually visible
if (process.env.NODE_ENV === "production" && !process.env.CLIENT_URL) {
  console.warn(
    "[cors] CLIENT_URL is not set, so only http://localhost:5173 is allowed " +
      "and the deployed frontend cannot reach the API. Set CLIENT_URL in the " +
      "host dashboard, then redeploy.",
  );
}

// Requests from anywhere else are rejected by the browser.
// credentials is required, otherwise the session cookie is never sent.
//
// A production deploy needs CLIENT_URL set to the live frontend domain, or the
// browser drops the response and the admin session cookie never arrives. Preview
// and production hosts differ, so a comma separated list is accepted and any one
// of them matching is enough.
const allowedOrigins = allowedOrigin
  .split(",")
  .map(normalise)
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // No Origin header at all, a curl or a server side call. Allowed, there is
    // no cookie to steal and nothing for CORS to protect
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(normalise(origin)))
      return callback(null, true);

    // false rather than an error, so the response goes out without the
    // allow header and the browser blocks it. The preflight is refused the same
    // way, so a disallowed origin cannot get a state changing request through
    return callback(null, false);
  },
  credentials: true,
};

module.exports = cors(corsOptions);