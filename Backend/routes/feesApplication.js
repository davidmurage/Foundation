import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import auth, { requireRole } from "../middleware/auth.js";
import requireApprovedStudentProfile from "../middleware/requireApprovedStudentProfile.js";
import FeeApplication from "../models/FeesApplication.js";
import Institution from "../models/Institution.js";

const router = express.Router();

/* ======================================================
   MULTER STORAGE — LOCAL DISK (FEES DOCUMENTS)
====================================================== */

const FEES_UPLOAD_DIR = "uploads/fees";

if (!fs.existsSync(FEES_UPLOAD_DIR)) {
  fs.mkdirSync(FEES_UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, FEES_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safe = file.fieldname.replace(/\s+/g, "-");
    cb(null, `${safe}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/* ======================================================
   CREATE FEES APPLICATION (STUDENT)
====================================================== */
router.post(
  "/",
  auth,
  requireRole("student"),
  requireApprovedStudentProfile,
  upload.fields([
    { name: "feeStructure", maxCount: 1 },
    { name: "feeStatement", maxCount: 1 },
    { name: "otherDocs", maxCount: 5 },
  ]),
  async (req, res) => {
    try {
      const {
        academicYear,
        yearOfStudy,
        institutionId,
        academicPeriod,
        periodStart,
        periodEnd,
        amountRequested,
      } = req.body;

      if (!academicYear || !academicPeriod || !institutionId) {
        return res.status(400).json({
          message: "Missing required academic information",
        });
      }

      const inst = await Institution.findById(institutionId).select("_id name type");
      if (!inst) {
        return res.status(400).json({ message: "Invalid institution selected" });
      }

      /* ========== DUPLICATE GUARD ========== */
      const existing = await FeeApplication.findOne({
        userId: req.user.id,
        institutionId: inst._id,
        academicYear,
        academicPeriod,
        reviewStatus: { $ne: "rejected" },
      });

      if (existing) {
        return res.status(409).json({
          message: `You already applied for ${academicPeriod} (${academicYear})`,
        });
      }

      /* ========== BUILD DOCUMENTS ========== */
      const documents = [];

      if (req.files?.feeStructure?.[0]) {
        documents.push({
          label: "Fee Structure",
          fileUrl: `/uploads/fees/${req.files.feeStructure[0].filename}`,
        });
      }

      if (req.files?.feeStatement?.[0]) {
        documents.push({
          label: "Fee Statement",
          fileUrl: `/uploads/fees/${req.files.feeStatement[0].filename}`,
        });
      }

      if (req.files?.otherDocs) {
        req.files.otherDocs.forEach((f) =>
          documents.push({
            label: "Other Document",
            fileUrl: `/uploads/fees/${f.filename}`,
          })
        );
      }

      const app = await FeeApplication.create({
        userId: req.user.id,
        academicYear,
        yearOfStudy,
        institutionType: inst.type,
        institutionId: inst._id,
        institutionName: inst.name,
        academicPeriod,
        periodStart,
        periodEnd,
        amountRequested,
        documents,
        reviewStatus: "pending",
        processingStatus: "processing",
        version: 1,
      });

      res.status(201).json(app);
    } catch (err) {
      console.error("FEE CREATE ERROR:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

/* ======================================================
   LIST MY APPLICATIONS (STUDENT)
====================================================== */
router.get("/", auth, requireRole("student"), async (req, res) => {
  const apps = await FeeApplication.find({ userId: req.user.id }).sort({
    createdAt: -1,
  });
  res.json(apps);
});

/* ======================================================
   UPDATE REJECTED APPLICATION (STUDENT)
====================================================== */
router.put(
  "/:id/update",
  auth,
  requireRole("student"),
  requireApprovedStudentProfile,
  upload.fields([
    { name: "feeStructure", maxCount: 1 },
    { name: "feeStatement", maxCount: 1 },
    { name: "otherDocs", maxCount: 5 },
  ]),
  async (req, res) => {
    try {
      const app = await FeeApplication.findById(req.params.id);
      if (!app) return res.status(404).json({ message: "Not found" });

      if (String(app.userId) !== req.user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (app.reviewStatus !== "rejected") {
        return res.status(400).json({
          message: "Only rejected applications can be edited",
        });
      }

      const {
        academicYear,
        yearOfStudy,
        academicPeriod,
        amountRequested,
      } = req.body;

      app.academicYear = academicYear;
      app.yearOfStudy = yearOfStudy;
      app.academicPeriod = academicPeriod;
      app.amountRequested = amountRequested;

      /* Replace documents if provided */
      const docs = [];

      if (req.files?.feeStructure?.[0]) {
        docs.push({
          label: "Fee Structure",
          fileUrl: `/uploads/fees/${req.files.feeStructure[0].filename}`,
        });
      }

      if (req.files?.feeStatement?.[0]) {
        docs.push({
          label: "Fee Statement",
          fileUrl: `/uploads/fees/${req.files.feeStatement[0].filename}`,
        });
      }

      if (req.files?.otherDocs) {
        req.files.otherDocs.forEach((f) =>
          docs.push({
            label: "Other Document",
            fileUrl: `/uploads/fees/${f.filename}`,
          })
        );
      }

      if (docs.length) app.documents = docs;

      app.reviewStatus = "pending";
      app.processingStatus = "processing";
      app.adminFeedback = "";
      app.version += 1;

      await app.save();
      res.json(app);
    } catch (err) {
      console.error("FEE UPDATE ERROR:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

/* ======================================================
   DELETE APPLICATION (ONLY IF REJECTED)
====================================================== */
router.delete("/:id", auth, requireRole("student"), requireApprovedStudentProfile, async (req, res) => {
  try {
    const app = await FeeApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ message: "Not found" });

    // Ownership check
    if (String(app.userId) !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Safety guard
    if (app.reviewStatus !== "rejected") {
      return res.status(400).json({
        message: "Only rejected applications can be deleted",
      });
    }

    // Delete files from disk
    if (app.documents?.length) {
      app.documents.forEach((doc) => {
        const filePath = `.${doc.fileUrl}`;
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    }

    await app.deleteOne();

    res.json({ message: "Application deleted successfully" });
  } catch (err) {
    console.error("DELETE FEE ERROR:", err);
    res.status(500).json({ message: "Delete failed" });
  }
});


/* ======================================================
   RESUBMIT (NO FILE CHANGE)
====================================================== */
router.put("/:id/resubmit", auth, requireRole("student"), requireApprovedStudentProfile, async (req, res) => {
  try {
    const app = await FeeApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ message: "Not found" });

    if (String(app.userId) !== req.user.id)
      return res.status(403).json({ message: "Forbidden" });

    if (app.reviewStatus !== "rejected") {
      return res.status(400).json({
        message: "Only rejected applications can be resubmitted",
      });
    }

    app.reviewStatus = "pending";
    app.processingStatus = "processing";
    app.adminFeedback = "";
    app.version += 1;

    await app.save();
    res.json(app);
  } catch (err) {
    console.error("FEE RESUBMIT ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
