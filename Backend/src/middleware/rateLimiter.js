const rateLimit = require("express-rate-limit");

// Tight limiter for login, to slow down brute-force attempts
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // 5 attempts per IP per window
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
  standardHeaders: "draft-8", // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false,
  ipv6Subnet: 56, // treat an IPv6 /64 as one visitor, not 4 billion

  skipSuccessfulRequests: true, // only failed logins count
});

// Loose limiter for the rest of the API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300, // 300 requests per IP per window
  message: {
    success: false,
    message: "Too many requests. Please slow down.",
  },
  standardHeaders: "draft-8",
  legacyHeaders: false,
  ipv6Subnet: 56,
});

module.exports = { limiter, apiLimiter };
