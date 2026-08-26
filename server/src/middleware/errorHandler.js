// Central error handler — controllers call next(err) instead of writing
// try/catch response logic everywhere. Keeps error formatting consistent.
export function errorHandler(err, req, res, next) {
  console.error(`[error] ${req.method} ${req.originalUrl} —`, err.message);

  const status = err.statusCode || 500;
  res.status(status).json({
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

// Catches requests to routes that don't exist.
export function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

export default { errorHandler, notFound };

