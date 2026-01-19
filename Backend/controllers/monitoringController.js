import os from "os";
import mongoose from "mongoose";

import RequestLog from "../models/RequestLog.js";
import SystemEvent from "../models/SystemEvent.js";
import AuditLog from "../models/AuditLog.js"; // you already have this
import User from "../models/User.js";

const mb = (n) => Math.round((n / 1024 / 1024) * 10) / 10;

export const getOverview = async (req, res) => {
  const now = Date.now();
  const mem = process.memoryUsage();

  const [reqCount24h, errCount24h, latestRequests, latestEvents] = await Promise.all([
    RequestLog.countDocuments({ createdAt: { $gte: new Date(now - 24 * 3600 * 1000) } }),
    RequestLog.countDocuments({
      createdAt: { $gte: new Date(now - 24 * 3600 * 1000) },
      statusCode: { $gte: 400 },
    }),
    RequestLog.find().sort({ createdAt: -1 }).limit(10).lean(),
    SystemEvent.find().sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  res.json({
    health: {
      uptimeSec: Math.floor(process.uptime()),
      node: process.version,
      platform: `${os.platform()} ${os.release()}`,
      cpuLoad: os.loadavg(), // [1m,5m,15m]
      memory: {
        rssMb: mb(mem.rss),
        heapUsedMb: mb(mem.heapUsed),
        heapTotalMb: mb(mem.heapTotal),
      },
      mongo: {
        state: mongoose.connection.readyState, // 1 is connected
        db: mongoose.connection.name || "",
      },
    },
    activity: {
      requests24h: reqCount24h,
      errors24h: errCount24h,
      latestRequests,
      latestEvents,
    },
  });
};

export const listRequests = async (req, res) => {
  const {
    q = "",
    status = "",
    method = "",
    from = "",
    to = "",
    limit = "50",
    page = "1",
  } = req.query;

  const L = Math.min(Number(limit) || 50, 200);
  const P = Math.max(Number(page) || 1, 1);

  const filter = {};

  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }
  if (status) filter.statusCode = Number(status);
  if (method) filter.method = method.toUpperCase();

  if (q) {
    filter.$or = [
      { path: { $regex: q, $options: "i" } },
      { userRole: { $regex: q, $options: "i" } },
      { method: { $regex: q, $options: "i" } },
    ];
  }

  const [total, rows] = await Promise.all([
    RequestLog.countDocuments(filter),
    RequestLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((P - 1) * L)
      .limit(L)
      .lean(),
  ]);

  res.json({ total, page: P, limit: L, rows });
};

export const listEvents = async (req, res) => {
  const { type = "", q = "", limit = "50", page = "1" } = req.query;

  const L = Math.min(Number(limit) || 50, 200);
  const P = Math.max(Number(page) || 1, 1);

  const filter = {};
  if (type) filter.type = type;
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { message: { $regex: q, $options: "i" } },
    ];
  }

  const [total, rows] = await Promise.all([
    SystemEvent.countDocuments(filter),
    SystemEvent.find(filter).sort({ createdAt: -1 }).skip((P - 1) * L).limit(L).lean(),
  ]);

  res.json({ total, page: P, limit: L, rows });
};

export const getDbOverview = async (req, res) => {
  const db = mongoose.connection.db;
  if (!db) return res.status(500).json({ message: "MongoDB not connected" });

  const collections = await db.listCollections().toArray();

  // Stats per collection (safe summary)
  const stats = [];
  for (const c of collections) {
    try {
      const s = await db.collection(c.name).estimatedDocumentCount();
      stats.push({ name: c.name, approxCount: s });
    } catch {
      stats.push({ name: c.name, approxCount: null });
    }
  }

  stats.sort((a, b) => (b.approxCount || 0) - (a.approxCount || 0));

  res.json({
    dbName: mongoose.connection.name,
    collections: stats,
  });
};

export const getAuditLogs = async (req, res) => {
  const { limit = "100" } = req.query;
  const L = Math.min(Number(limit) || 100, 200);

  const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(L).lean();
  res.json(logs);
};

// ---- SSE Live Stream (requests + events) ----
export const streamLive = async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  let lastReqAt = new Date(Date.now() - 10 * 1000);
  let lastEvtAt = new Date(Date.now() - 10 * 1000);

  const interval = setInterval(async () => {
    try {
      const [reqs, evts] = await Promise.all([
        RequestLog.find({ createdAt: { $gt: lastReqAt } }).sort({ createdAt: 1 }).limit(50).lean(),
        SystemEvent.find({ createdAt: { $gt: lastEvtAt } }).sort({ createdAt: 1 }).limit(50).lean(),
      ]);

      if (reqs.length) lastReqAt = reqs[reqs.length - 1].createdAt;
      if (evts.length) lastEvtAt = evts[evts.length - 1].createdAt;

      const payload = { requests: reqs, events: evts };
      res.write(`event: live\n`);
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch (e) {
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({ message: "stream error" })}\n\n`);
    }
  }, 1500);

  req.on("close", () => {
    clearInterval(interval);
    res.end();
  });
};

// helper to create a system event (optional external use)
export const createSystemEvent = async ({ type = "INFO", title, message = "", actorId = null, actorRole = "", meta = {} }) => {
  try {
    await SystemEvent.create({ type, title, message, actorId, actorRole, meta });
  } catch {
    // silent
  }
};
