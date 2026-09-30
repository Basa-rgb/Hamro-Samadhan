const Joi = require("joi");

// Fields required to log in
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  // Matches the minimum length enforced when the password was set
  password: Joi.string().min(6).required(),
});

module.exports = {
  loginSchema,
};