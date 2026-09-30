const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/auth");
const { requireAdmin } = authMiddleware;

const validate = require("../middleware/validate.middleware");

const {
  createDepartment,
  getAllDepartments,
  assignDepartment,
  updateDepartment,
} = require("../controllers/department.controller");

const {
  createDepartmentSchema,
  assignDepartmentSchema,
  updateDepartmentSchema,
} = require("../validation/department.validation");

const {
  updateReportStatus,
  updateReportPriority,
  getAdminStats,
  getAdminReportById,
  getReportUpdates,
} = require("../controllers/Report.controller");

const {
  updateStatusSchema,
  updatePrioritySchema,
} = require("../validation/reportUpdate.validation");

const { objectIdSchema } = require("../validation/params.validation");

// Every route below needs a valid session and the admin role, so a signed-in
// non-admin is refused before the handler runs
// Create Department
router.post(
  "/",
  authMiddleware,
  requireAdmin,
  validate(createDepartmentSchema),
  createDepartment,
);

// Get All Departments
router.get("/", authMiddleware, requireAdmin, getAllDepartments);

// Counters for the dashboard overview
// Declared before the /:id routes so "stats" can never be read as an id
router.get("/stats", authMiddleware, requireAdmin, getAdminStats);

// Full report for the admin detail view, unlike the trimmed public one
router.get(
  "/reports/:id",
  authMiddleware,
  requireAdmin,
  validate(objectIdSchema, "params"),
  getAdminReportById,
);

// Change history for one report, newest first
router.get(
  "/reports/:id/updates",
  authMiddleware,
  requireAdmin,
  validate(objectIdSchema, "params"),
  getReportUpdates,
);

// Assign Department
// params are checked first so :id is valid before the body is read
router.patch(
  "/:id/department",
  authMiddleware,
  requireAdmin,
  validate(objectIdSchema, "params"),
  validate(assignDepartmentSchema),
  assignDepartment,
);

// Update Report Status
// The reporter is mailed by the controller once the new status is saved
router.patch(
  "/:id/status",
  authMiddleware,
  requireAdmin,
  validate(objectIdSchema, "params"),
  validate(updateStatusSchema),
  updateReportStatus,
);

// Update Report Priority
router.patch(
  "/:id/priority",
  authMiddleware,
  requireAdmin,
  validate(objectIdSchema, "params"),
  validate(updatePrioritySchema),
  updateReportPriority,
);

// Update Department
// Full update, so every field is required
router.patch(
  "/:id",
  authMiddleware,
  requireAdmin,
  validate(objectIdSchema, "params"),
  validate(updateDepartmentSchema),
  updateDepartment,
);

module.exports = router;
