const Joi = require("joi");

// Fields an admin may change after creation
// The message shown to the reporter, an empty string clears it
const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid(
      "PENDING",
      "UNDER_REVIEW",
      "IN_PROGRESS",
      "RESOLVED",
      "REJECTED"
    )
    .required(),

  message: Joi.string().trim().max(1000).allow(""),
});

// Priority can be changed on its own, without touching the status
const updatePrioritySchema = Joi.object({
  priority: Joi.string()
    .valid("LOW", "MEDIUM", "HIGH", "URGENT")
    .required(),
});

module.exports = {
  updateStatusSchema,
  updatePrioritySchema,
};