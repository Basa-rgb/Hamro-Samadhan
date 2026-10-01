const Joi = require("joi");

// Validate location JSON string
// latitude and longitude are optional, but must stay inside these ranges
// An address is a place a citizen can recognise, so an email is rejected
const locationSchema = Joi.object({
  address: Joi.string()
    .trim()
    .max(300)
    .required()
    .custom((value, helpers) => {
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return helpers.message({
          custom: "Location must be a place name, not an email",
        });
      }

      return value;
    }),

  latitude: Joi.number()
    .min(-90)
    .max(90)
    .optional(),

  longitude: Joi.number()
    .min(-180)
    .max(180)
    .optional(),
});

// Validate reporter JSON string
// Accepts exactly 10 digits, no spaces or punctuation
const reporterSchema = Joi.object({
  name: Joi.string().trim().max(100).required(),

  email: Joi.string().email().required(),

  phone: Joi.string()
    .trim()
    .pattern(/^[0-9]{10}$/)
    .required(),
});

// Convert JSON string → object → validate
// Nested objects arrive as strings from multipart form data
const jsonObject = (schema) =>
  Joi.string()
    .required()
    .custom((value, helpers) => {
      let parsed;

      try {
        parsed = JSON.parse(value);
      } catch (error) {
        return helpers.error("any.invalid");
      }

      const { error } = schema.validate(parsed, {
        abortEarly: false,
      });

      if (error) {
        // Keep the inner reason, otherwise the client only sees "invalid data"
        return helpers.error("any.invalid", {
          reason: error.details.map((detail) => detail.message).join("; "),
        });
      }

      return value;
    })
    .messages({
      "any.invalid": "{{#label}} is invalid: {{#reason}}",
    });

// Creating a report
const createReportSchema = Joi.object({
  title: Joi.string()
    .trim()
    .max(150)
    .required(),

  // Shape only. Whether the value names a category that currently exists is
  // checked against the collection in the controller, because the list is data
  // now and not a compile time constant
  category: Joi.string()
    .trim()
    .lowercase()
    .max(60)
    .pattern(/^[a-z0-9]+(?:_[a-z0-9]+)*$/)
    .required(),

  description: Joi.string()
    .trim()
    .max(2000)
    .required(),

  location: jsonObject(locationSchema),

  reporter: jsonObject(reporterSchema),
});

// Filters and paging for the admin report list
// Defaults keep the first page small, an unbounded list would load every report
const listQuerySchema = Joi.object({
  status: Joi.string()
    .valid("PENDING", "UNDER_REVIEW", "IN_PROGRESS", "RESOLVED", "REJECTED")
    .optional(),

  priority: Joi.string()
    .valid("LOW", "MEDIUM", "HIGH", "URGENT")
    .optional(),

  // One complaint type. The admin list filter sends one value. The shape is the
  // same slug as the stored value, so a filter can never be anything else
  category: Joi.string()
    .trim()
    .lowercase()
    .max(60)
    .pattern(/^[a-z0-9]+(?:_[a-z0-9]+)*$/)
    .optional(),

  // Restricts the list to one department, so an admin can work through a single
  // queue. The department id is checked in the controller, a query string cannot
  // be validated as an ObjectId here without the extra import for no gain
  department: Joi.string().trim().max(24).optional(),

  // Free text over the id and title, so an admin can find one report fast
  search: Joi.string().trim().max(100).allow("").optional(),

  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  createReportSchema,
  listQuerySchema,
};