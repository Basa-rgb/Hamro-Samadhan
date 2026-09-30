// Validates req[property] against a Joi schema, or returns 400
const validate = (schema, property = "body") => {
  return (req, res, next) => {
    // Collects every error instead of stopping at the first
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      convert: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map((detail) => detail.message),
      });
    }

    // Replace with the converted/trimmed value Joi gives back.
    // Express 5 exposes req.query as a getter only, so a plain assignment there
    // is silently dropped and every default and coercion would be lost
    if (property === "query") {
      Object.defineProperty(req, "query", {
        configurable: true,
        enumerable: true,
        writable: true,
        value,
      });
    } else {
      req[property] = value;
    }

    next();
  };
};

module.exports = validate;
