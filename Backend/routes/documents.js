import express from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utils/cloudinary.js";
import StudentDocument from "../models/StudentDocument.js";
import Performance from "../models/Performance.js";
import auth, { requireRole } from "../middleware/auth.js";
import axios from "axios";
import { toPlainText, extractGpa } from "../utils/transcriptParser.js";

const router = express.Router();

// Cloudinary storage (auto handles pdf, doc, images, etc.)
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "kcb_documents",
    resource_type: "auto", // lets Cloudinary decide
  },
});
const upload = multer({ storage });

/**
 * Upload Document
 */
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

      // Save document metadata
      const newDoc = await StudentDocument.create({
        userId: req.user.id,
        name,
        yearOfStudy,
        admissionNo,
        institutionType,
        academicPeriod,
        documentType,
        fileUrl: req.file.path, // Cloudinary URL
      });

      // If transcript → parse for GPA/grades
      if (documentType === "Transcript") {
        try {
          // Download file back from Cloudinary
          const fileRes = await axios.get(req.file.path, {
            responseType: "arraybuffer",
          });
          const buffer = Buffer.from(fileRes.data);

          // Extract plain text
          const text = await toPlainText(buffer, {
            mimetype: req.file.mimetype || "",
            originalname: req.file.originalname || "",
          });

          // Pull GPA/Grade info
          const { gpa, rawAverage, meanGrade } = extractGpa(text);
          const status = gpa === null ? "pending" : "complete";

          // Save/update performance
          await Performance.findOneAndUpdate(
            { userId: req.user.id, yearOfStudy, academicPeriod },
            {
              gpa,
              rawAverage,
              meanGrade,
              status,
              sourceDocumentId: newDoc._id,
            },
            { upsert: true, new: true }
          );
        } catch (err) {
          console.error("Transcript parse error:", err.message);
        }
      }

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

/**
 * Get all documents for logged-in student
 */
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

/**
 * Delete a document
 */
router.delete("/:id", auth, requireRole("student"), async (req, res) => {
  try {
    const doc = await StudentDocument.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!doc) {
      return res.status(404).json({ message: "Not found" });
    }
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
