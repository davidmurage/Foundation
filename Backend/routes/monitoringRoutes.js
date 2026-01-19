import express from "express";
import auth, { requireRole } from "../middleware/auth.js";
import jwt from "jsonwebtoken";

import {
  getOverview,
  listRequests,
  listEvents,
  getDbOverview,
  getAuditLogs,
  streamLive,
} from "../controllers/monitoringController.js";
import User from "../models/User.js";

const router = express.Router();

// All monitoring endpoints are ADMIN only
router.get("/overview", auth, requireRole("admin"), getOverview);
router.get("/requests", auth, requireRole("admin"), listRequests);
router.get("/events", auth, requireRole("admin"), listEvents);
router.get("/db", auth, requireRole("admin"), getDbOverview);
router.get("/audit", auth, requireRole("admin"), getAuditLogs);
router.get("/stream", async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(401).end();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id)
      .select("_id role")
      .lean();

    if (!user || user.role !== "admin") {
      return res.status(403).end();
    }

    // Manually attach user
    req.user = {
      id: user._id,
      role: user.role,
    };

    return streamLive(req, res);
  } catch (err) {
    console.error("STREAM AUTH ERROR:", err.message);
    return res.status(401).end();
  }
});;

export default router;
