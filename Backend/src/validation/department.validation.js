const Joi = require("joi");

// Creating a department
const createDepartmentSchema = Joi.object({
  name: Joi.string().trim().max(100).required(),

  description: Joi.string().trim().max(500).required(),
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

  isActive: Joi.boolean(),
}).min(1);

module.exports = {
  createDepartmentSchema,
  assignDepartmentSchema,
  updateDepartmentSchema,
};