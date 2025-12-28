import express from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import auth, { requireRole } from "../middleware/auth.js";
import FeeApplication from "../models/FeesApplication.js";
import Institution from "../models/Institution.js";
import cloudinary from "../utils/cloudinary.js";

const router = express.Router();

/* ===============================
   MULTER STORAGE (PDF / DOC)
================================ */
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "kcb_fees_documents",
    resource_type: "auto", // IMPORTANT for pdf/docx
    //allowed_formats: ["pdf", "doc", "docx"],
  },
});

const upload = multer({ storage });

/* ===============================
   CREATE FEES APPLICATION
================================ */
router.post(
  "/",
  auth,
  requireRole("student"),
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
        institutionType,
        institutionId,
        academicPeriod,
        periodStart,
        periodEnd,
        amountRequested,
      } = req.body;

      const inst = await Institution.findById(institutionId).select("_id name type");
      if (!inst) {
        return res.status(400).json({ message: "Invalid institution selected" });
      }

      /* BUILD DOCUMENT LIST */
      const documents = [];

      if (req.files?.feeStructure?.[0]) {
        documents.push({
          label: "Fee Structure",
          fileUrl: req.files.feeStructure[0].path,
        });
      }

      if (req.files?.feeStatement?.[0]) {
        documents.push({
          label: "Fee Statement",
          fileUrl: req.files.feeStatement[0].path,
        });
      }

      if (req.files?.otherDocs) {
        req.files.otherDocs.forEach((f) => {
          documents.push({
            label: "Other Document",
            fileUrl: f.path,
          });
        });
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
      });

      res.status(201).json(app);
    } catch (err) {
      console.error("FEE CREATE ERROR:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

/* ===============================
   LIST MY APPLICATIONS
================================ */
router.get("/", auth, requireRole("student"), async (req, res) => {
  const apps = await FeeApplication.find({ userId: req.user.id })
    .sort({ createdAt: -1 });
  res.json(apps);
});

/* ===============================
   RESUBMIT (ONLY IF REJECTED)
================================ */
router.put("/:id/resubmit", auth, requireRole("student"), async (req, res) => {
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
