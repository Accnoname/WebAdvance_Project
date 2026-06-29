const { sendError } = require('../utils/response.util');

// HOF validate với Joi schema
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(d => d.message);
    return res.status(400).json(sendError('Dữ liệu không hợp lệ', 400, errors));
  }
  next();
};

module.exports = { validate };
