import express from "express";
import auth, { requireRole } from "../middleware/auth.js";
import Feedback from "../models/Feedback.js";
import { upload } from "../utils/upload.js";

const router = express.Router();

function fileToAttachment(file) {
  return {
    url: `/uploads/${file.filename}`,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
  };
}

/* =========================================================
   CREATE NEW THREAD (supports text + optional attachment)
   POST /api/feedback
   body: (multipart/form-data) message, page, file?
========================================================= */
router.post("/", auth, upload.single("file"), async (req, res) => {
  try {
    const { message, page } = req.body;

    if (!message?.trim() && !req.file) {
      return res.status(400).json({ message: "Message or file required" });
    }

    const attachments = req.file ? [fileToAttachment(req.file)] : [];

    const feedback = await Feedback.create({
      user: req.user.id,
      role: req.user.role,
      page: page || "/",
      status: "open",
      lastUserMessageAt: new Date(),
      messages: [
        {
          sender: "user",
          text: message?.trim() || "",
          attachments,
          readByAdminAt: null,
          readByUserAt: new Date(),
        },
      ],
    });

    const io = req.app.get("io");
    io?.to("admins").emit("feedback:new", feedback);

    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================================================
   GET USER THREADS
   GET /api/feedback/my
========================================================= */
router.get("/my", auth, async (req, res) => {
  const threads = await Feedback.find({ user: req.user.id }).sort({ updatedAt: -1 });
  res.json(threads);
});

/* =========================================================
   USER ADD MESSAGE (supports text + optional attachment)
   POST /api/feedback/:id/message
========================================================= */
router.post("/:id/message", auth, upload.single("file"), async (req, res) => {
  try {
    const { message } = req.body;

    if (!message?.trim() && !req.file) {
      return res.status(400).json({ message: "Message or file required" });
    }

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ message: "Not found" });

    if (String(feedback.user) !== String(req.user.id)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const attachments = req.file ? [fileToAttachment(req.file)] : [];

    feedback.messages.push({
      sender: "user",
      text: message?.trim() || "",
      attachments,
      readByAdminAt: null,
      readByUserAt: new Date(),
    });

    feedback.status = "open";
    feedback.lastUserMessageAt = new Date();
    feedback.resolvedAt = null;

    await feedback.save();

    const io = req.app.get("io");
    io?.to("admins").emit("feedback:update", feedback);

    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================================================
   ADMIN GET ALL THREADS
   GET /api/feedback
========================================================= */
router.get("/", auth, requireRole("admin"), async (req, res) => {
  const items = await Feedback.find()
    .populate("user", "fullName email")
    .sort({ updatedAt: -1 });

  res.json(items);
});

/* =========================================================
   ADMIN REPLY (supports text + optional attachment)
   POST /api/feedback/:id/reply
========================================================= */
router.post("/:id/reply", auth, requireRole("admin"), upload.single("file"), async (req, res) => {
  try {
    const { message, resolve } = req.body;

    if (!message?.trim() && !req.file) {
      return res.status(400).json({ message: "Message or file required" });
    }

    const feedback = await Feedback.findById(req.params.id).populate("user", "fullName email");
    if (!feedback) return res.status(404).json({ message: "Not found" });

    const attachments = req.file ? [fileToAttachment(req.file)] : [];

    feedback.messages.push({
      sender: "admin",
      text: message?.trim() || "",
      attachments,
      readByAdminAt: new Date(),
      readByUserAt: null,
    });

    feedback.lastAdminReplyAt = new Date();

    // if resolve = true -> resolve; otherwise keep open
    const shouldResolve = String(resolve) === "true";
    feedback.status = shouldResolve ? "resolved" : "open";
    feedback.resolvedAt = shouldResolve ? new Date() : null;

    await feedback.save();

    const io = req.app.get("io");
    io?.to(`user:${feedback.user?._id}`).emit("feedback:reply", feedback);
    io?.to("admins").emit("feedback:update", feedback);

    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================================================
   ANALYTICS DASHBOARD
   GET /api/feedback/analytics
========================================================= */
router.get("/analytics", auth, requireRole("admin"), async (req, res) => {
  const total = await Feedback.countDocuments();
  const open = await Feedback.countDocuments({ status: "open" });
  const resolved = await Feedback.countDocuments({ status: "resolved" });

  const byPageAgg = await Feedback.aggregate([
    { $group: { _id: "$page", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  // avg response time (admin reply - last user message)
  const responseTimesAgg = await Feedback.aggregate([
    {
      $match: {
        lastUserMessageAt: { $ne: null },
        lastAdminReplyAt: { $ne: null },
      },
    },
    {
      $project: {
        responseMs: { $subtract: ["$lastAdminReplyAt", "$lastUserMessageAt"] },
      },
    },
    {
      $group: {
        _id: null,
        avgResponseMs: { $avg: "$responseMs" },
      },
    },
  ]);

  // messages per day (last 14 days)
  const since = new Date();
  since.setDate(since.getDate() - 14);

  const perDayAgg = await Feedback.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: {
          y: { $year: "$createdAt" },
          m: { $month: "$createdAt" },
          d: { $dayOfMonth: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.y": 1, "_id.m": 1, "_id.d": 1 } },
  ]);

  const avgResponseMs = responseTimesAgg?.[0]?.avgResponseMs ?? null;

  res.json({
    totals: { total, open, resolved },
    byPage: byPageAgg.map((x) => ({ page: x._id, count: x.count })),
    avgResponseMs,
    perDay: perDayAgg.map((x) => ({
      date: `${x._id.y}-${String(x._id.m).padStart(2, "0")}-${String(x._id.d).padStart(2, "0")}`,
      count: x.count,
    })),
  });
});

/* =========================================================
   AI AUTO-SUGGESTION (Admin)
   POST /api/feedback/:id/suggest-reply
========================================================= */
router.post("/:id/suggest-reply", auth, requireRole("admin"), async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id).populate("user", "fullName email");
    if (!feedback) return res.status(404).json({ message: "Not found" });

    const lastUserMsgs = feedback.messages
      .filter((m) => m.sender === "user")
      .slice(-3)
      .map((m) => m.text)
      .filter(Boolean)
      .join("\n");

    // If OPENAI_API_KEY exists, use AI. Otherwise fallback rule-based.
    if (process.env.OPENAI_API_KEY) {
      const prompt = `
You are a support agent. Write a helpful, short reply to the user.
Context:
- Page: ${feedback.page}
- User role: ${feedback.role}
- Last user messages:
${lastUserMsgs}

Return ONLY the reply text.
`;

      const ai = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          messages: [
            { role: "system", content: "You write clear support replies." },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
        }),
      });

      const out = await ai.json();
      const suggestion = out?.choices?.[0]?.message?.content?.trim() || "";

      return res.json({ suggestion });
    }

    // fallback
    const suggestion =
      "Thanks for reaching out. We’ve received your report and we’re investigating. " +
      "Please confirm the exact steps you took and any error message you saw, and we’ll assist.";

    res.json({ suggestion });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
