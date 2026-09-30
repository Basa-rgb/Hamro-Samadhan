const Joi = require("joi");

// Checks the :id route param
// hex + length 24 is the shape of a Mongo ObjectId
const objectIdSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

// Checks the :reportId route param, for example HS-2026-000042
const reportIdSchema = Joi.object({
  reportId: Joi.string()
    .pattern(/^HS-\d{4}-\d{6}$/)
    .required(),
});

// Checks the tracking token on the public lookup, 48 hex characters from 24
// random bytes. Optional, because the lookup still works without it, just
// without the citizen's own details
const reportTokenQuerySchema = Joi.object({
  token: Joi.string()
    .hex()
    .length(48)
    .optional(),
});

module.exports = {
  objectIdSchema,
  reportIdSchema,
  reportTokenQuerySchema,
};