const Joi = require("joi");

// The stored value. Derived from the label when a category is created, so it is
// always a lower snake slug. Lowercase letters, digits and single underscores,
// nothing else, because a value ends up in a URL filter and in a department's
// category list.
const valueSchema = Joi.string()
  .trim()
  .lowercase()
  .min(3)
  .max(60)
  .pattern(/^[a-z0-9]+(?:_[a-z0-9]+)*$/);

// Creating a category
// value is derived by the controller from the label, so an admin never types one.
// Sending it is still allowed, for seeding and for the rare deliberate value.
const createCategorySchema = Joi.object({
  value: valueSchema,

  label: Joi.string().trim().min(2).max(80).required(),

  labelNe: Joi.string().trim().allow("").max(120).default(""),

  description: Joi.string().trim().allow("").max(300).default(""),

  order: Joi.number().integer().min(0).max(9999).default(100),

  isActive: Joi.boolean().default(true),
});

// Editing a category
// Only the label is really editable. value is the identity every report and
// department points at, so the controller refuses to change it; order, isActive
// and the text fields are the rest of what an admin adjusts.
const updateCategorySchema = Joi.object({
  label: Joi.string().trim().min(2).max(80),

  labelNe: Joi.string().trim().allow("").max(120),

  description: Joi.string().trim().allow("").max(300),

  order: Joi.number().integer().min(0).max(9999),

  isActive: Joi.boolean(),
}).min(1);

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  valueSchema,
};