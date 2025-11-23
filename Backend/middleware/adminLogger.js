import AuditLog from "../models/AuditLog.js";

export const logAdminAction = (action, details = "") => {
  return async (req, res, next) => {
    try {
      if (req.user) {
        await AuditLog.create({
          actorId: req.user._id,
          actorName: req.user.fullName,
          actorEmail: req.user.email,
          action,
          details,
        });
      }
    } catch (error) {
      console.error("LOGGING ERROR:", error);
    }
    next();
  };
};
