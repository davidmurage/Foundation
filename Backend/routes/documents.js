import express from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utils/cloudinary.js";
import StudentDocument from "../models/StudentDocument.js";
import auth, { requireRole } from "../middleware/auth.js";

const router = express.Router();

// Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "kcb_documents",
    allowed_formats: ["pdf", "jpg", "jpeg", "png"],
  },
});
const upload = multer({ storage });

// Upload Document
router.post(
  "/upload",
  auth,
  requireRole("student"),
  upload.single("document"),
  async (req, res) => {
    try {
      const { name,yearOfStudy, admissionNo, institutionType, academicPeriod, documentType } = req.body;

      if (!req.file) return res.status(400).json({ message: "File upload failed" });

      const newDoc = new StudentDocument({
        userId: req.user.id,
        name,
        yearOfStudy,
        admissionNo,
        institutionType,
        academicPeriod,
        documentType,
        fileUrl: req.file.path,
      });

      await newDoc.save();
      res.json({ message: "Document uploaded successfully", document: newDoc });
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

// Get documents for logged-in student
router.get("/", auth, requireRole("student"), async (req, res) => {
  try {
    const docs = await StudentDocument.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
