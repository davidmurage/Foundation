import RequestLog from "../models/RequestLog.js";

function safeKeys(obj) {
  if (!obj || typeof obj !== "object") return [];
  return Object.keys(obj).slice(0, 50);
}

export default function requestLogger() {
  return async function (req, res, next) {
    const start = Date.now();

    // finish hook
    res.on("finish", async () => {
      try {
        const durationMs = Date.now() - start;

        // Skip logging very noisy/static endpoints if you want:
        const skip =
          req.path.startsWith("/uploads") ||
          req.path.includes(".map") ||
          req.path.includes("favicon");

        if (skip) return;

        const doc = {
          method: req.method,
          path: req.originalUrl?.split("?")[0] || req.path,
          statusCode: res.statusCode,
          durationMs,

          userId: req.user?.id || req.user?._id || null,
          userRole: req.user?.role || "",

          ip: req.headers["x-forwarded-for"]?.toString()?.split(",")[0]?.trim() || req.ip || "",
          userAgent: req.headers["user-agent"] || "",

          queryKeys: safeKeys(req.query),
          bodyKeys: safeKeys(req.body),
        };

        await RequestLog.create(doc);
      } catch (e) {
        // do not crash app if logging fails
        // console.error("REQUEST LOG ERROR:", e);
      }
    });

    next();
  };
}
