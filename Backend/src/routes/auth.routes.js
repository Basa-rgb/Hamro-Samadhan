const express = require("express");

const {
    login,
    getMe,
    logout,
} = require("../controllers/User.controller");
const { limiter } = require("../middleware/rateLimiter");
const authMiddleware = require("../middleware/auth");
const { requireAdmin } = authMiddleware;
const validate = require("../middleware/validate.middleware");
const { loginSchema } = require("../validation/auth.validation");

const router = express.Router();


// Admin Login
// Public route, so it is the only one without authMiddleware
// limiter throttles repeated failures to slow down brute force
router.post("/login", limiter, validate(loginSchema), login);


// Get Current Admin
// requireAdmin, so a session without the admin role learns nothing
router.get("/me", authMiddleware, requireAdmin, getMe);


// Admin Logout
router.post("/logout", authMiddleware, logout);


module.exports = router;