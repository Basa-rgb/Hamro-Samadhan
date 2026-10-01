const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const { requireStaff } = authMiddleware;
const validate = require("../middleware/validate.middleware");
const upload = require("../middleware/upload.middleware");
const { createReportSchema, listQuerySchema } = require("../validation/report.validation");
const { reportIdSchema, reportTokenQuerySchema } = require("../validation/params.validation");
const {
  createReport,
  getReportById,
  getAllReports,
} = require("../controllers/Report.controller");

// Anyone may submit a report, no session needed
// The upload middleware runs first so req.body is already filled
router.post("/", ...upload, validate(createReportSchema), createReport);

// Public lookup, the report id alone is enough to follow progress
// A tracking token is optional and only unlocks the reporter's own details
router.get(
  "/:reportId",
  validate(reportIdSchema, "params"),
  validate(reportTokenQuerySchema, "query"),
  getReportById,
);

// Listing reports is staff only.
//
// requireStaff rather than requireAdmin, because a department admin works through
// this same list. The controller narrows it to their department's categories, so
// widening the gate here does not widen what they receive
router.get(
  "/",
  authMiddleware,
  requireStaff,
  validate(listQuerySchema, "query"),
  getAllReports,
);

module.exports = router;