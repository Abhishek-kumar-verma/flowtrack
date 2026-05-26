/**
 * Global Express error-handling middleware.
 *
 * Must be registered LAST (after all routes) with four parameters so Express
 * recognises it as an error handler.
 *
 * Returns a consistent JSON envelope:
 *   { success: false, message: string, stack?: string }
 *
 * The `stack` field is only included in development mode to avoid leaking
 * internal implementation details in production.
 */
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  // Default to 500 unless the error already carries an HTTP status code
  const statusCode = err.statusCode || err.status || 500;

  // Prisma known-request errors (P2002 = unique constraint, etc.)
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: `A record with this ${err.meta?.target?.join(', ')} already exists.`,
    });
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: err.meta?.cause || 'Record not found.',
    });
  }

  const response = {
    success: false,
    message: err.message || 'Internal Server Error',
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
