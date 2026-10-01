// Builds the Express app:
// security headers, CORS, body parsing, rate limit, routes, health check, 404 handler

const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const dotenv = require("dotenv");

const corsMiddleware = require("./config/cors");
const { apiLimiter } = require("./middleware/rateLimiter");

dotenv.config();

const app = express();

// --------------------------------------------------
// 1. Trust proxy
// --------------------------------------------------
// Needed when deployed behind Render's reverse proxy.
// Helps Express and express-rate-limit identify the
// correct client IP.
app.set(
  "trust proxy",
  Number(process.env.TRUST_PROXY_HOPS) || false
);

// --------------------------------------------------
// 2. Security headers
// --------------------------------------------------
app.use(helmet());

// --------------------------------------------------
// 3. CORS
// --------------------------------------------------
app.use(corsMiddleware);

// --------------------------------------------------
// 4. Body parsing
// --------------------------------------------------
// 100kb limit prevents unnecessarily large requests.
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// --------------------------------------------------
// 5. Cookie parser
// --------------------------------------------------
app.use(cookieParser());

// --------------------------------------------------
// 6. API rate limiter
// --------------------------------------------------
// Only /api routes are rate limited.
// Health check "/" is not rate limited.
app.use("/api", apiLimiter);

// --------------------------------------------------
// 7. Import routes
// --------------------------------------------------
const authRoutes = require("./routes/auth.routes");
const reportRoutes = require("./routes/report.routes");
const categoryRoutes = require("./routes/category.routes");
const faqRoutes = require("./routes/faq.routes");
const adminRoutes = require("./routes/admin.routes");

// --------------------------------------------------
// 8. API routes
// --------------------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/faqs", faqRoutes);
app.use("/api/admin", adminRoutes);

// --------------------------------------------------
// 9. Root / health-check route
// --------------------------------------------------
// IMPORTANT:
// This must come BEFORE the catch-all 404 handler.
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Hamro Samadhan API is running",
  });
});

// --------------------------------------------------
// 10. Catch-all 404 handler
// --------------------------------------------------
// This must ALWAYS be the LAST route.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// --------------------------------------------------
// 11. Export app
// --------------------------------------------------
module.exports = app;