const express = require("express");
const router = express.Router();
const { getFaqs } = require("../controllers/Faq.controller");

// Public list, so the FAQ page never hardcodes the questions
router.get("/", getFaqs);

module.exports = router;
