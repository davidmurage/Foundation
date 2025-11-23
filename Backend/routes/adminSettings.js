import express from "express";
import auth, { requireRole } from "../middleware/auth.js";


import {
  getProfile,
  updateProfile,
  changePassword,
  getSystem,
  updateSystem,
  getNotifications,
  updateNotifications,
  getSecurity,
  updateSecurity,
  getAuditLogs,
} from "../controllers/settingsController.js";

import { logAdminAction } from "../middleware/adminLogger.js";

const router = express.Router();

// PROFILE
router.get("/profile", auth, requireRole("admin"), getProfile);
router.put(
  "/profile",
  auth,
  requireRole("admin"),
  logAdminAction("Updated Profile Settings"),
  updateProfile
);

// PASSWORD
router.put(
  "/change-password",
  auth,
  requireRole("admin"),
  logAdminAction("Changed Password"),
  changePassword
);

// SYSTEM
router.get("/system", auth, requireRole("admin"), getSystem);
router.put(
  "/system",
  auth,
  requireRole("admin"),
  logAdminAction("Updated System Settings"),
  updateSystem
);

// NOTIFICATIONS
router.get("/notifications", auth, requireRole("admin"), getNotifications);
router.put(
  "/notifications",
  auth,
  requireRole("admin"),
  logAdminAction("Updated Notification Settings"),
  updateNotifications
);

// SECURITY
router.get("/security", auth, requireRole("admin"), getSecurity);
router.put(
  "/security",
  auth,
  requireRole("admin"),
  logAdminAction("Updated Security Settings"),
  updateSecurity
);

// LOGS
router.get("/logs", auth, requireRole("admin"), getAuditLogs);

export default router;
