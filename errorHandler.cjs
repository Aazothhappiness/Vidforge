// VidForge - Express error middleware
const { logger } = require('../utils/logging.cjs');

function errorHandler(err, req, res, next) {
  // Log the error
  logger.error('error', `Express error: ${err.message}`, null, {
    method: req.method,
    url: req.url,
    stack: err.stack,
    body: req.body ? JSON.stringify(req.body).substring(0, 500) : undefined
  });

  // Don't send error response if headers already sent
  if (res.headersSent) {
    return next(err);
  }

  // Determine status code
  let statusCode = 500;
  if (err.statusCode) statusCode = err.statusCode;
  else if (err.status) statusCode = err.status;
  else if (err.name === 'ValidationError') statusCode = 400;
  else if (err.name === 'UnauthorizedError') statusCode = 401;
  else if (err.name === 'ForbiddenError') statusCode = 403;
  else if (err.name === 'NotFoundError') statusCode = 404;

  // Create error response
  const errorResponse = {
    ok: false,
    error: err.message || 'Internal server error',
    details: {
      name: err.name,
      code: err.code,
      statusCode
    }
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
}

// Async error wrapper
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { errorHandler, asyncHandler };