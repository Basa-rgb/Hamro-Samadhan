const express = require("express");

const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { requireAdmin, requireStaff } = authMiddleware;
const validate = require("../middleware/validate.middleware");
const { objectIdSchema } = require("../validation/params.validation");
const {
  updateStatusSchema,
  updatePrioritySchema,
} = require("../validation/reportUpdate.validation");
const {
  updateReportStatus,
  updateReportPriority,
  getAdminStats,
  getAdminReportById,
  getReportUpdates,
} = require("../controllers/Report.controller");
const {
  createDepartment,
  getAllDepartments,
  assignDepartment,
  updateDepartment,
  getDepartmentsForCategory,
} = require("../controllers/department.controller");
const {
  createDepartmentSchema,
  assignDepartmentSchema,
  updateDepartmentSchema,
} = require("../validation/department.validation");
const {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/Category.controller");
const {
  createCategorySchema,
  updateCategorySchema,
  valueSchema,
} = require("../validation/category.validation");
const {
  getAllUsers,
  createUser,
  updateUser,
  setUserPassword,
} = require("../controllers/User.controller");
const {
  createUserSchema,
  updateUserSchema,
  setPasswordSchema,
} = require("../validation/user.validation");

// The two gates, in one place for this file:
//
//   requireAdmin  a full admin only. Categories, departments and staff accounts
//                 live here, because all three of those decide what a scoped
//                 account is allowed to reach, and a scoped account must not be
//                 able to widen its own scope
//   requireStaff  a full admin or a department admin. The dashboard and the
//                 report actions live here, and the controllers narrow them to
//                 the caller's department
//
// Every literal path is declared before "/:id", otherwise "categories" or "users"
// would be read as an ObjectId and fail validation.

// ============ CATEGORIES (full admin only) ============

// Retired categories included, so one can be brought back
router.get("/categories", authMiddleware, requireAdmin, getAllCategories);

router.post(
  "/categories",
  authMiddleware,
  requireAdmin,
  validate(createCategorySchema),
  createCategory,
);

router.patch(
  "/categories/:id",
  authMiddleware,
  requireAdmin,
  validate(objectIdSchema, "params"),
  validate(updateCategorySchema),
  updateCategory,
);

// Refused while any report or department still references the value, so a
// category is retired rather than deleted out from under live data
router.delete(
  "/categories/:id",
  authMiddleware,
  requireAdmin,
  validate(objectIdSchema, "params"),
  deleteCategory,
);

// ============ STAFF ACCOUNTS (full admin only) ============

router.get("/users", authMiddleware, requireAdmin, getAllUsers);

router.post(
  "/users",
  authMiddleware,
  requireAdmin,
  validate(createUserSchema),
  createUser,
);

router.patch(
  "/users/:id",
  authMiddleware,
  requireAdmin,
  validate(objectIdSchema, "params"),
  validate(updateUserSchema),
  updateUser,
);

// Also drops every live session for that account
router.patch(
  "/users/:id/password",
  authMiddleware,
  requireAdmin,
  validate(objectIdSchema, "params"),
  validate(setPasswordSchema),
  setUserPassword,
);

// ============ DEPARTMENT LOOKUP ============

// Which departments handle a complaint type, used to suggest a routing target on
// an unassigned report. Safe for staff, because it only names departments and
// their category lists, both of which are already visible on the report itself
router.get(
  "/departments/for-category/:category",
  authMiddleware,
  requireStaff,
  validate({ category: valueSchema }, "params"),
  getDepartmentsForCategory,
);

// ============ DASHBOARD AND REPORTS (any staff, inside their own scope) ============

// Counters for the dashboard overview, filtered to the caller's department.
// Declared before the /:id routes so "stats" can never be read as an id
router.get("/stats", authMiddleware, requireStaff, getAdminStats);

// Full report for the admin detail view, unlike the trimmed public one
router.get(
  "/reports/:id",
  authMiddleware,
  requireStaff,
  validate(objectIdSchema, "params"),
  getAdminReportById,
);

// Change history for one report, newest first
router.get(
  "/reports/:id/updates",
  authMiddleware,
  requireStaff,
  validate(objectIdSchema, "params"),
  getReportUpdates,
);

// ============ DEPARTMENT CRUD (full admin only) ============

router.post(
  "/",
  authMiddleware,
  requireAdmin,
  validate(createDepartmentSchema),
  createDepartment,
);

router.get("/", authMiddleware, requireAdmin, getAllDepartments);

router.patch(
  "/:id",
  authMiddleware,
  requireAdmin,
  validate(objectIdSchema, "params"),
  validate(updateDepartmentSchema),
  updateDepartment,
);

// ============ REPORT ACTIONS (any staff, inside their own scope) ============

// Assign Department
// A department admin may only confirm their own department. params are checked
// first so :id is valid before the body is read
router.patch(
  "/:id/department",
  authMiddleware,
  requireStaff,
  validate(objectIdSchema, "params"),
  validate(assignDepartmentSchema),
  assignDepartment,
);

// Update Report Status
// The reporter is mailed by the controller once the new status is saved
router.patch(
  "/:id/status",
  authMiddleware,
  requireStaff,
  validate(objectIdSchema, "params"),
  validate(updateStatusSchema),
  updateReportStatus,
);

// Update Report Priority
router.patch(
  "/:id/priority",
  authMiddleware,
  requireStaff,
  validate(objectIdSchema, "params"),
  validate(updatePrioritySchema),
  updateReportPriority,
);

module.exports = router;