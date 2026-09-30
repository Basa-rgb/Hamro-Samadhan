const Session = require("../models/Session");

// Resolves the session token into req.user, or returns 401
// Runs before every admin route, and again on /api/auth/me
const authMiddleware = async (req, res, next) => {
  try {
    // Token from header, else from cookie
    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : null;
    const token = bearerToken || req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // The hash lookup drops expired sessions, so no expiry check is needed here
    const session = await Session.findValid(token).populate(
      "user",
      "name email role isActive",
    );

    // Token unknown, already expired, or the account was disabled or deleted
    if (!session || !session.user || !session.user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired session",
      });
    }

    // Role comes from the database on every request, so a demotion applies at once
    req.user = {
      userId: session.user._id,
      role: session.user.role,
      name: session.user.name,
      email: session.user.email,
    };
    req.sessionToken = token;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired session",
    });
  }
};

// Second gate, so a non-admin can never reach an admin handler
// Kept separate from authMiddleware so the check cannot be forgotten silently
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }

  next();
};

module.exports = authMiddleware;
module.exports.requireAdmin = requireAdmin;
