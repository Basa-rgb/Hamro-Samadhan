const cors = require("cors");

// Origin the browser is served from, so the cookie is accepted
// Falls back to the Vite dev server, which is what local runs use
const allowedOrigin =
  process.env.CLIENT_URL || "http://localhost:5173";

// Requests from anywhere else are rejected by the browser.
// credentials is required, otherwise the session cookie is never sent.
//
// A production deploy needs CLIENT_URL set to the live frontend domain, or the
// browser drops the response and the admin session cookie never arrives. Preview
// and production hosts differ, so a comma separated list is accepted and any one
// of them matching is enough.
const allowedOrigins = allowedOrigin
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // No Origin header at all, a curl or a server side call. Allowed, there is
    // no cookie to steal and nothing for CORS to protect
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) return callback(null, true);

    // false rather than an error, so the response goes out without the
    // allow header and the browser blocks it. The preflight is refused the same
    // way, so a disallowed origin cannot get a state changing request through
    return callback(null, false);
  },
  credentials: true,
};

module.exports = cors(corsOptions);