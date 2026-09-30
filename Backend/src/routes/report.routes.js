const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload.middleware");
const authMiddleware = require("../middleware/auth");
const { requireAdmin } = authMiddleware;
const validate = require("../middleware/validate.middleware");
const { createReportSchema } = require("../validation/report.validation");
const { reportIdSchema, reportTokenQuerySchema } = require("../validation/params.validation");
const { listQuerySchema } = require("../validation/report.validation");
const {
  createReport,
  getReportById,
  getAllReports,
} = require("../controllers/Report.controller");

// Any signed-in user may submit a report
// The upload middleware runs first so req.body is already filled
router.post(
  "/",
  ...upload,
  validate(createReportSchema),
  createReport,
);

// Public lookup, the report id alone is enough to follow progress
// A tracking token is optional and only unlocks the reporter's own details
router.get(
  "/:reportId",
  validate(reportIdSchema, "params"),
  validate(reportTokenQuerySchema, "query"),
  getReportById
);

// Listing every report is admin only
router.get(
  "/",
  authMiddleware,
  requireAdmin,
  validate(listQuerySchema, "query"),
  getAllReports,
);

module.exports = router;
