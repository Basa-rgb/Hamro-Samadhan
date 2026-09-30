const express = require("express");
const router = express.Router();
const { getCategories } = require("../controllers/Category.controller");

// Public list, so the report form never hardcodes the options
router.get("/", getCategories);

module.exports = router;
