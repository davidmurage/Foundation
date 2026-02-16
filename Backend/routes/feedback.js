import express from "express";
import auth, { requireRole } from "../middleware/auth.js";
import Feedback from "../models/FeedBack.js";

const router = express.Router();

/* =========================
   CREATE NEW THREAD
========================= */
router.post("/", auth, async (req, res) => {
  try {
    const { message, page } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message required" });
    }

    const feedback = await Feedback.create({
      user: req.user.id,
      role: req.user.role,
      page,
      messages: [
        {
          sender: "user",
          text: message,
        },
      ],
    });

    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   GET USER THREADS
========================= */
router.get("/my", auth, async (req, res) => {
  const threads = await Feedback.find({ user: req.user.id })
    .sort({ updatedAt: -1 });

  res.json(threads);
});

/* =========================
   USER ADD MESSAGE
========================= */
router.post("/:id/message", auth, async (req, res) => {
  const { message } = req.body;

  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) return res.status(404).json({ message: "Not found" });

  feedback.messages.push({
    sender: "user",
    text: message,
  });

  feedback.status = "open";
  await feedback.save();

  res.json(feedback);
});

/* =========================
   ADMIN GET ALL THREADS
========================= */
router.get("/", auth, requireRole("admin"), async (req, res) => {
  const items = await Feedback.find()
    .populate("user", "fullName email")
    .sort({ updatedAt: -1 });

  res.json(items);
});

/* =========================
   ADMIN REPLY
========================= */
router.post("/:id/reply", auth, requireRole("admin"), async (req, res) => {
  const { message } = req.body;

  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) return res.status(404).json({ message: "Not found" });

  feedback.messages.push({
    sender: "admin",
    text: message,
  });

  feedback.status = "resolved";
  await feedback.save();

  res.json(feedback);
});

export default router;
