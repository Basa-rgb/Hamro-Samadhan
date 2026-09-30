const cors = require("cors");

// Origin the browser is served from, so the cookie is accepted
// Falls back to the Vite dev server, which is what local runs use
const allowedOrigin =
  process.env.CLIENT_URL || "http://localhost:5173";

// Requests from anywhere else are rejected by the browser.
// credentials is required, otherwise the session cookie is never sent.
const corsOptions = {
  origin: allowedOrigin,
  // Required so the auth cookie is sent along with the request
  credentials: true,
};

module.exports = cors(corsOptions);