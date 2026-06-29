const sendSuccess = (message, data = null, statusCode = 200) => ({
  success: true,
  statusCode,
  message,
  data
});

const sendError = (message, statusCode = 500, errors = null) => ({
  success: false,
  statusCode,
  message,
  errors
});

const sendPaginated = (message, data, pagination) => ({
  success: true,
  message,
  data,
  pagination: {
    page: pagination.page,
    limit: pagination.limit,
    total: pagination.total,
    totalPages: Math.ceil(pagination.total / pagination.limit)
  }
});

module.exports = { sendSuccess, sendError, sendPaginated };
