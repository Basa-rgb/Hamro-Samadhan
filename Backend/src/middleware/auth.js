const Session = require("../models/Session");
const Report = require("../models/Report");
const Department = require("../models/Department");

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
      "name email role department isActive",
    );

    // Token unknown, already expired, or the account was disabled or deleted
    if (!session || !session.user || !session.user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired session",
      });
    }

    // A department admin with no department is a misconfigured account, not a
    // valid session. Refusing it here means the scope checks further down never
    // have to reason about an undefined scope.
    if (
      session.user.role === "department_admin" &&
      !session.user.department
    ) {
      return res.status(401).json({
        success: false,
        message: "Account is not assigned to a department",
      });
    }

    // Role comes from the database on every request, so a demotion applies at once
    req.user = {
      userId: session.user._id,
      role: session.user.role,
      name: session.user.name,
      email: session.user.email,
      // Null for a full admin, which is how the scope helper tells the two apart
      departmentId: session.user.department
        ? session.user.department._id
        : null,
      departmentName: session.user.department
        ? session.user.department.name
        : null,
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

// Third gate: any signed in staff account, whatever their role. Used by the
// routes a department admin is meant to work in, as the outer gate, with
// requireAdmin left in front of the routes they must not reach.
//
// This is deliberately wider than requireAdmin. Narrowing a route is done by
// adding requireAdmin next to it, never by widening requireStaff, so a new route
// is staff by default and has to be opted into full admin.
const STAFF_ROLES = ["admin", "department_admin"];

const requireStaff = (req, res, next) => {
  if (!req.user || !STAFF_ROLES.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Staff access required",
    });
  }

  next();
};

// The report query a signed in member of staff is allowed to run.
//
// A full admin gets an empty object, so their query is whatever they asked for. A
// department admin gets their department's category list merged in, which is
// what keeps them inside their own work.
//
// Returns null when the caller is a department admin whose department has no
// categories at all. There is nothing they may see, and an empty $in: [] has to
// match nothing rather than everything, so that case is passed down as its own
// value and the controllers short circuit on it.
//
// The category list is read fresh on every request. Caching it on the session
// would mean a category reassignment only took effect at the next login, which
// is exactly the kind of lag that makes a permission change look like it failed.
const buildReportScope = async (req) => {
  if (!req.user || req.user.role === "admin") {
    return {};
  }

  const department = await Department.findById(req.user.departmentId)
    .select("categories")
    .lean();

  const categories = department?.categories || [];

  if (!categories.length) {
    return null;
  }

  return { category: { $in: categories } };
};

// The single report a staff account may act on, found in one query.
//
// Returns null when it is out of scope, which the controllers answer as a 404.
// A 403 would tell the caller the report exists, and report ids are sequential,
// so leaking existence is the thing worth avoiding here.
const findScopedReport = async (req, id) => {
  const scope = await buildReportScope(req);

  if (scope === null) {
    return null;
  }

  return Report.findOne({ _id: id, ...scope });
};

// True when the caller may only touch their own department.
//
// A department admin can never route a report outside their department, because
// the whole point of the role is that the department owns its categories and
// nothing else. Only a full admin assigns across departments.
const isOwnDepartment = (req, departmentId) => {
  if (!req.user || req.user.role === "admin") return true;

  return String(req.user.departmentId) === String(departmentId);
};

module.exports = authMiddleware;
module.exports.requireAdmin = requireAdmin;
module.exports.requireStaff = requireStaff;
module.exports.buildReportScope = buildReportScope;
module.exports.findScopedReport = findScopedReport;
module.exports.isOwnDepartment = isOwnDepartment;
