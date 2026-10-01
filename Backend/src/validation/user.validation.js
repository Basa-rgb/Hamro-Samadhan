const Joi = require("joi");

// A department must exist and be a real ObjectId, hex + length 24
const departmentSchema = Joi.string()
  .hex()
  .length(24)
  .allow("")
  .default("");

// Creating a staff account
//
// department is validated by shape here and for real in the controller, which has
// to check that it exists, is active, and that the category list behind it is not
// empty. An empty department is refused there and not here, because "no such
// department" and "department handles nothing" need two different messages
const createUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),

  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .max(160)
    .required(),

  // 12 characters is the shortest that is still worth having, the same floor the
  // login form enforces
  password: Joi.string().min(12).max(128).required(),

  role: Joi.string().valid("admin", "department_admin").default("admin"),

  department: departmentSchema,

  isActive: Joi.boolean().default(true),
});

// Editing a staff account
//
// Every field is optional so a partial edit only sends what changed. The password
// is left out on purpose: changing someone's password is a separate route with its
// own rate limit, so it cannot be triggered from the edit form by accident
const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),

  role: Joi.string().valid("admin", "department_admin"),

  department: Joi.string().hex().length(24).allow(""),

  isActive: Joi.boolean(),
}).min(1);

// Setting a new password on someone else's account
const setPasswordSchema = Joi.object({
  password: Joi.string().min(12).max(128).required(),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  setPasswordSchema,
};