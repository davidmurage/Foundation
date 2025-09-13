import express from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utils/cloudinary.js";
import StudentDocument from "../models/StudentDocument.js";
import auth, { requireRole } from "../middleware/auth.js";

const router = express.Router();

// ✅ Cloudinary storage (auto-detects images, pdf, docs)
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "kcb_documents",
    resource_type: "auto", // 🔑 auto-detect file type (image/raw)
  },
});

const upload = multer({ storage });

// 📤 Upload Document
router.post(
  "/upload",
  auth,
  requireRole("student"),
  upload.single("document"),
  async (req, res) => {
    try {
      const {
        name,
        yearOfStudy,
        admissionNo,
        institutionType,
        academicPeriod,
        documentType,
      } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: "File upload failed" });
      }

      // Save metadata in MongoDB
      const newDoc = new StudentDocument({
        userId: req.user.id,
        name,
        yearOfStudy,
        admissionNo,
        institutionType,
        academicPeriod,
        documentType,
        fileUrl: req.file.path, // ✅ Cloudinary URL
      });

      await newDoc.save();

      res.json({
        message: "Document uploaded successfully",
        document: newDoc,
      });
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

// 📥 Get documents for logged-in student
router.get("/", auth, requireRole("student"), async (req, res) => {
  try {
    const docs = await StudentDocument.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// 🗑️ Delete document
router.delete("/:id", auth, requireRole("student"), async (req, res) => {
  try {
    const doc = await StudentDocument.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id, // ensure students can only delete their own
    });

    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.json({ message: "Document deleted successfully", id: req.params.id });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});


export default router;
