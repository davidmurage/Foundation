import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";

/**
 * Rate limiters to prevent abuse and traffic spikes
 */
export function applyTrafficGuards(app) {
  // General API limiter
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120, // 120 requests / minute per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests. Please try again shortly." },
  });

  // Slow down bursty traffic
  const apiSlowDown = slowDown({
    windowMs: 60 * 1000,
    delayAfter: 60, // after 60 req/min add delays
    delayMs: () => 200, // 200ms delay per request over threshold
  });

  // Stronger limiter for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { message: "Too many login attempts. Try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api", apiSlowDown, apiLimiter);
  app.use("/api/auth", authLimiter);
}
