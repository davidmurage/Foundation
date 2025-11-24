import express from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utils/cloudinary.js";
import StudentDocument from "../models/StudentDocument.js";
import Performance from "../models/Performance.js";
import auth, { requireRole } from "../middleware/auth.js";
import axios from "axios";
import { toPlainText, extractGpa } from "../utils/transcriptParser.js";
import Settings from "../models/Settings.js";
import User from "../models/User.js";
import { pushNotification } from "../utils/notify.js";

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

      // Load settings + student info
      const settings = await Settings.findOne();
      const student = await User.findById(req.user.id);
      const adminId = settings?.system?.adminUserId || null;

      // Send admin notification ONLY if enabled
      if (settings?.notifications?.notifyAdminOnNewDocument) {
        await pushNotification({
          userId: adminId,
          title: "New Document Uploaded",
          message: `${student.fullName} uploaded a ${documentType} document.`,
          email: settings.system.notificationEmail,
        });
      }

      //  Transcript parsing (GPA extraction)
      if (documentType === "Transcript") {
        try {
          // Download Cloudinary file
          const fileRes = await axios.get(req.file.path, {
            responseType: "arraybuffer",
          });

          const buffer = Buffer.from(fileRes.data);

          // Convert to plain text
          const text = await toPlainText(buffer, {
            mimetype: req.file.mimetype || "",
            originalname: req.file.originalname || "",
          });

          // Extract grades
          const { gpa, rawAverage, meanGrade } = extractGpa(text);
          const status = gpa === null ? "pending" : "complete";

          // Save/update performance entry
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

      //Response to student
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
