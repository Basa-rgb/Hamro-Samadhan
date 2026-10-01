const express = require("express");

const {
    login,
    getMe,
    logout,
} = require("../controllers/User.controller");
const { limiter } = require("../middleware/rateLimiter");
const authMiddleware = require("../middleware/auth");
const { requireStaff } = authMiddleware;
const validate = require("../middleware/validate.middleware");
const { loginSchema } = require("../validation/auth.validation");

const router = express.Router();


// Admin Login
// Public route, so it is the only one without authMiddleware
// limiter throttles repeated failures to slow down brute force
router.post("/login", limiter, validate(loginSchema), login);


// Who am I
//
// requireStaff, not requireAdmin: a department admin has to be able to ask this
// question, and the answer is what tells the portal which nav and which
// department's queue to show. It carries no report data
router.get("/me", authMiddleware, requireStaff, getMe);


// Admin Logout
router.post("/logout", authMiddleware, logout);


module.exports = router;