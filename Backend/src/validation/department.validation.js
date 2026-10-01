const Joi = require("joi");

// The complaint types a department handles. Shape only, the values are checked
// against the collection in the controller, because the list is data now and
// adding a category must not mean a deploy
const categoriesSchema = Joi.array()
  .items(Joi.string().trim().lowercase().max(60))
  .max(100)
  .default([]);

// Creating a department
const createDepartmentSchema = Joi.object({
  name: Joi.string().trim().max(100).required(),

  description: Joi.string().trim().max(500).required(),

  categories: categoriesSchema,
});

// Picking the department a report gets routed to
// hex + length 24 is the shape of a Mongo ObjectId
const assignDepartmentSchema = Joi.object({
  departmentId: Joi.string().hex().length(24).required(),
});

// Fields an admin may change on an existing department
// Each is optional so a partial edit only sends what changed, which is what
// the controller applies. At least one field must be present
const updateDepartmentSchema = Joi.object({
  name: Joi.string().trim().max(100),

  description: Joi.string().trim().max(500),

  // Sent in full every time, so clearing every box is a real instruction rather
  // than an absent field
  categories: Joi.array()
    .items(Joi.string().trim().lowercase().max(60))
    .max(100),

  isActive: Joi.boolean(),
}).min(1);

module.exports = {
  createDepartmentSchema,
  assignDepartmentSchema,
  updateDepartmentSchema,
};