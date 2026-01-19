export function notFound(req, res) {
  res.status(404).json({ message: "Route not found" });
}

export function errorHandler(err, req, res, next) {
  console.error("API ERROR:", err);

  // Mongoose cast errors, etc.
  const status = err.status || 500;

  res.status(status).json({
    message: err.message || "Server error",
    // Hide stack in production
    ...(process.env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
  });
}
