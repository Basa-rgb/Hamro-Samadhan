// Builds the express app: security headers, CORS, body parsing, rate limit, routes
const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const dotenv = require("dotenv");

const corsMiddleware = require("./config/cors");
const { apiLimiter } = require("./middleware/rateLimiter");

dotenv.config();

const app = express();

// Number of reverse proxies in front of us, needed for correct client IPs
// and for express-rate-limit to see the real address behind a proxy
app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS) || false);

app.use(helmet());

app.use(corsMiddleware);

// 100kb keeps large base64 uploads from filling server memory
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(cookieParser());

// Throttle only the API routes, not static or health checks
app.use("/api", apiLimiter);

const authRoutes = require("./routes/auth.routes");
const reportRoutes = require("./routes/report.routes");
const categoryRoutes = require("./routes/category.routes");
const faqRoutes = require("./routes/faq.routes");
const adminRoutes = require("./routes/admin.routes");

app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/faqs", faqRoutes);
app.use("/api/admin", adminRoutes);

// Catch-all so unmatched paths return JSON 404 instead of express' HTML page
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

module.exports = app;
