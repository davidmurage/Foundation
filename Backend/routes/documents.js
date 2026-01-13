import express from "express";
import path from "path"
import multer from "multer";
import fs from "fs";

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
   LOCAL STORAGE CONFIG (SAME STYLE AS FEES)
----------------------------------------------*/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/documents";
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

/* ---------------------------------------------
   Helper: Normalize Academic Period
----------------------------------------------*/
function normalizePeriod(period) {
  if (!period) return null;
  return period.trim();
}



/* ---------------------------------------------
   UPLOAD DOCUMENT
----------------------------------------------*/
router.post(
  "/upload",
  auth,
  requireRole("student"),
  upload.single("document"),
  
  async (req, res) => {
    try {
      const {
        admissionNo,
        yearOfStudy,
        institutionType,
        academicPeriod,
        documentType,
      } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: "File upload failed" });
      }

      if (!admissionNo || !yearOfStudy || !academicPeriod || !documentType) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const normalizedPeriod = normalizePeriod(academicPeriod);

      /* ---------------------------------------------
         SAVE DOCUMENT
      ----------------------------------------------*/
      const newDoc = await StudentDocument.create({
        userId: req.user.id,
        admissionNo,
        yearOfStudy,
        institutionType,
        academicPeriod: normalizedPeriod,
        documentType,
        fileUrl: `/uploads/documents/${req.file.filename}`,
      });

      /* ---------------------------------------------
         NOTIFICATIONS (OPTIONAL)
      ----------------------------------------------*/
      const settings = await Settings.findOne();
      const student = await User.findById(req.user.id);

      if (settings?.notifications?.notifyAdminOnNewDocument) {
        await pushNotification({
          userId: settings.system.adminUserId,
          title: "New Document Uploaded",
          message: `${student.fullName} uploaded a ${documentType}`,
          email: settings.system.notificationEmail,
        });
      }

      return res.json({
        message: "Document uploaded successfully",
        document: newDoc,
      });
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);


/* ---------------------------------------------
   GET STUDENT DOCUMENTS
----------------------------------------------*/
router.get("/", auth, requireRole("student"), async (req, res) => {
  try {
    const docs = await StudentDocument.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: "Failed to load documents" });
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

    // delete file from disk
    const filePath = path.join(process.cwd(), doc.fileUrl);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

export default router;
