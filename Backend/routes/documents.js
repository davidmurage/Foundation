import express from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utils/cloudinary.js";

import StudentDocument from "../models/StudentDocument.js";
import Performance from "../models/Performance.js";
import StudentProfile from "../models/StudentProfile.js";

import auth, { requireRole } from "../middleware/auth.js";

import axios from "axios";
import { toPlainText, extractGpa } from "../utils/transcriptParser.js";
import Settings from "../models/Settings.js";
import User from "../models/User.js";
import { pushNotification } from "../utils/notify.js";

const router = express.Router();

/* ---------------------------------------------
   CLOUDINARY STORAGE
----------------------------------------------*/
const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => {
    const mimetype = file.mimetype;

    // PDF MUST use resource_type=raw
    const isPdf = mimetype === "application/pdf";

    return {
      folder: "kcb_documents",
      resource_type: isPdf ? "raw" : "auto",
      public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`
    };
  },
});


const upload = multer({ storage });

/* ---------------------------------------------
   Helper: Determine expected academicPeriod
----------------------------------------------*/
function normalizePeriod(period) {
  if (!period) return null;

  const p = period.toLowerCase();

  if (p.includes("1") && p.includes("2")) return "Semester 1&2";
  if (p.includes("1") && p.includes("3")) return "Semester 1&2&3";

  if (p.includes("sem 1") || p.includes("semester 1")) return "Semester 1";
  if (p.includes("sem 2") || p.includes("semester 2")) return "Semester 2";
  if (p.includes("sem 3") || p.includes("semester 3")) return "Semester 3";

  if (p.includes("term 1")) return "Term 1";
  if (p.includes("term 2")) return "Term 2";
  if (p.includes("term 3")) return "Term 3";

  if (p.includes("attachment")) return "Attachment";

  return period; // fallback
}

/* ---------------------------------------------
   UPLOAD DOCUMENT ROUTE
----------------------------------------------*/
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

      const normalizedPeriod = normalizePeriod(academicPeriod);

      /* ---------------------------------------------
         SAVE DOCUMENT METADATA
      ----------------------------------------------*/
      const newDoc = await StudentDocument.create({
        userId: req.user.id,
        name,
        yearOfStudy,
        admissionNo,
        institutionType,
        academicPeriod: normalizedPeriod,
        documentType,
        fileUrl: req.file.path,
      });

      /* ---------------------------------------------
         Notifications
      ----------------------------------------------*/
      const settings = await Settings.findOne();
      const student = await User.findById(req.user.id);
      const adminId = settings?.system?.adminUserId;

      if (settings?.notifications?.notifyAdminOnNewDocument) {
        await pushNotification({
          userId: adminId,
          title: "New Document Uploaded",
          message: `${student.fullName} uploaded a ${documentType} document.`,
          email: settings.system.notificationEmail,
        });
      }

      /* ---------------------------------------------
         TRANSCRIPT PARSING
      ----------------------------------------------*/
      if (documentType === "Transcript") {
        try {
          // 1. Download Cloudinary file
          const fileRes = await axios.get(req.file.path, {
            responseType: "arraybuffer",
          });

          const buffer = Buffer.from(fileRes.data);

          // 2. Convert file → plain text
          const text = await toPlainText(buffer, {
            mimetype: req.file.mimetype,
            originalname: req.file.originalname,
          });

          // DEBUG LOG
          console.log("Extracted Text Preview:", text.substring(0, 300));

          // 3. Extract GPA / Mean Grade / Average(%)
          const { gpa, rawAverage, meanGrade } = extractGpa(text);

          const status = gpa !== null ? "complete" : "pending";

          // 4. Save GPA into Performance Model
          await Performance.findOneAndUpdate(
            { userId: req.user.id, yearOfStudy, academicPeriod: normalizedPeriod },
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
          console.error("TRANSCRIPT PARSE ERROR:", err.message);
        }
      }

      return res.json({
        message: "Document uploaded successfully",
        document: newDoc,
      });
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      res.status(500).json({ message: err.message });
    }
  }
);

/* ---------------------------------------------
   GET ALL DOCUMENTS FOR STUDENT
----------------------------------------------*/
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

/* ---------------------------------------------
   DELETE DOCUMENT
----------------------------------------------*/
router.delete("/:id", auth, requireRole("student"), async (req, res) => {
  try {
    const doc = await StudentDocument.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!doc) return res.status(404).json({ message: "Not found" });

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
