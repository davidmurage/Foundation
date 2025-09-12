import jwt from "jsonwebtoken";

/**
 * Auth middleware
 * - Expects Authorization: Bearer <token>
 * - Attaches req.user = { id, role }
 */
export default function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Authorization header missing or malformed" });
  }

  try {
    const secret = process.env.JWT_SECRET || "SECRET_KEY";
    const payload = jwt.verify(token, secret); // { id, role, iat, exp }
    req.user = { id: payload.id, role: payload.role };
    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(401).json({ message: "Invalid token" });
  }
}

/**
 * Role guard:
 * usage: router.get('/admin', auth, requireRole('admin'), handler)
 */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Unauthenticated" });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Forbidden: insufficient role" });
  }
  return next();
};
