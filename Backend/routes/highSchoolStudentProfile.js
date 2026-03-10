import express from "express";
import auth from "../middleware/auth.js";

import HighSchoolAdmin from "../models/HighSchoolAdmin.js";
import HighSchoolStudent from "../models/HighSchoolStudent.js";

import HighSchoolStudentDocument from "../models/HighSchoolStudentDocument.js";
import HighSchoolStudentPerformance from "../models/HighSchoolStudentPerformance.js";
import HighSchoolStudentFeeRecord from "../models/HighSchoolStudentFeeRecord.js";

import multer from "multer";
import fs from "fs";

const router = express.Router();

const uploadDir = "uploads/hs";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

async function requireHSAdmin(req) {
  return HighSchoolAdmin.findOne({ user: req.user.id, isActive: true });
}

async function loadStudentInSameSchool(studentId, institutionId) {
  const student = await HighSchoolStudent.findById(studentId);
  if (!student) return null;
  if (String(student.institution) !== String(institutionId)) return "FORBIDDEN";
  return student;
}

/**
 * GET PROFILE BUNDLE
 */
router.get("/:id/profile", auth, async (req, res) => {
  try {
    const admin = await requireHSAdmin(req);
    if (!admin) return res.status(403).json({ message: "Access denied" });

    const student = await loadStudentInSameSchool(req.params.id, admin.institution);
    if (!student) return res.status(404).json({ message: "Student not found" });
    if (student === "FORBIDDEN") return res.status(403).json({ message: "Access denied" });

    const [performance, feeRecords, documents] = await Promise.all([
      HighSchoolStudentPerformance.find({ student: student._id }).sort({ createdAt: -1 }),
      HighSchoolStudentFeeRecord.find({ student: student._id }).sort({ academicYear: -1, term: -1 }),
      HighSchoolStudentDocument.find({ student: student._id }).sort({ createdAt: -1 }),
    ]);

    res.json({ student, performance, feeRecords, documents });
  } catch (err) {
    console.error("HS PROFILE ERROR:", err);
    res.status(500).json({ message: "Failed to load student profile" });
  }
});

/**
 * PERFORMANCE: CREATE
 */
router.post("/:id/performance", auth, async (req, res) => {
  try {
    const admin = await requireHSAdmin(req);
    if (!admin) return res.status(403).json({ message: "Access denied" });

    const student = await loadStudentInSameSchool(req.params.id, admin.institution);
    if (!student) return res.status(404).json({ message: "Student not found" });
    if (student === "FORBIDDEN") return res.status(403).json({ message: "Access denied" });

    const payload = {
  student: student._id,
  institution: admin.institution,
  curriculum: student.curriculum,
  academicYear: req.body.academicYear,
  term: req.body.term,
  examName: req.body.examName || "End Term",
  remarks: req.body.remarks || "",
  createdBy: req.user.id,
};

if (student.curriculum === "CBE") {
  payload.learningArea = req.body.learningArea;
  payload.competencyLevel = req.body.competencyLevel;
} else {
  payload.meanScore = req.body.meanScore;
  payload.meanGrade = req.body.meanGrade;
}

const performance = await HighSchoolStudentPerformance.create(payload);


    res.status(201).json(performance);
  } catch (err) {
    console.error("HS PERF CREATE ERROR:", err);
    res.status(500).json({ message: err.message || "Failed to add performance" });
  }
});

/**
 * PERFORMANCE: UPDATE
 */
router.put("/performance/:perfId", auth, async (req, res) => {
  try {
    const admin = await requireHSAdmin(req);
    if (!admin) return res.status(403).json({ message: "Access denied" });

    const perf = await HighSchoolStudentPerformance.findById(req.params.perfId);
    if (!perf) return res.status(404).json({ message: "Not found" });

    if (String(perf.institution) !== String(admin.institution)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const updated = await HighSchoolStudentPerformance.findByIdAndUpdate(
      req.params.perfId,
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error("HS PERF UPDATE ERROR:", err);
    res.status(500).json({ message: "Failed to update performance" });
  }
});

/**
 * PERFORMANCE: DELETE
 */
router.delete("/performance/:perfId", auth, async (req, res) => {
  try {
    const admin = await requireHSAdmin(req);
    if (!admin) return res.status(403).json({ message: "Access denied" });

    const perf = await HighSchoolStudentPerformance.findById(req.params.perfId);
    if (!perf) return res.status(404).json({ message: "Not found" });

    if (String(perf.institution) !== String(admin.institution)) {
      return res.status(403).json({ message: "Access denied" });
    }

    await HighSchoolStudentPerformance.findByIdAndDelete(req.params.perfId);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("HS PERF DELETE ERROR:", err);
    res.status(500).json({ message: "Failed to delete performance" });
  }
});

router.post("/fees/:studentId", auth, async (req, res) => {
  try {
    const admin = await requireHSAdmin(req);
    if (!admin) return res.status(403).json({ message: "Access denied" });

    const student = await loadStudentInSameSchool(
      req.params.studentId,
      admin.institution
    );
    if (!student || student === "FORBIDDEN")
      return res.status(403).json({ message: "Access denied" });

    const record = await HighSchoolStudentFeeRecord.create({
      student: student._id,
      institution: admin.institution,   
      academicYear: req.body.academicYear,
      term: req.body.term,
      totalFees: req.body.totalFees,
      paidAmount: req.body.paidAmount || 0,
      createdBy: req.user.id,
      updatedBy: req.user.id,            
    });

    res.status(201).json(record);
  } catch (err) {
    console.error("HS FEES CREATE ERROR:", err);
    res.status(500).json({ message: "Failed to add fee record" });
  }
});


/**
 * FEES: UPSERT (one record per year+term)
 */
router.put("/:id/fees", auth, async (req, res) => {
  try {
    const admin = await requireHSAdmin(req);
    if (!admin) return res.status(403).json({ message: "Access denied" });

    const student = await loadStudentInSameSchool(req.params.id, admin.institution);
    if (!student) return res.status(404).json({ message: "Student not found" });
    if (student === "FORBIDDEN") return res.status(403).json({ message: "Access denied" });

    const { academicYear, term, totalFees, breakdown, paidAmount } = req.body;

    const record = await HighSchoolStudentFeeRecord.findOneAndUpdate(
  { student: student._id, academicYear, term },
  {
    student: student._id,
    institution: admin.institution,   
    academicYear,
    term,
    totalFees,
    breakdown: breakdown || [],
    paidAmount: paidAmount || 0,
    updatedBy: req.user.id,           
  },
  { upsert: true, new: true }
);


    res.json(record);
  } catch (err) {
    console.error("HS FEES UPSERT ERROR:", err);
    res.status(500).json({ message: "Failed to save fees" });
  }
});

/**
 * FEES: DELETE
 */
router.delete("/fees/:feeId", auth, async (req, res) => {
  try {
    const admin = await requireHSAdmin(req);
    if (!admin) return res.status(403).json({ message: "Access denied" });

    const fee = await HighSchoolStudentFeeRecord.findById(req.params.feeId);
    if (!fee) return res.status(404).json({ message: "Not found" });

    await HighSchoolStudentFeeRecord.findByIdAndDelete(req.params.feeId);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete fee record" });
  }
});


/**
 * DOCUMENTS: UPLOAD
 */
router.post("/:id/documents", auth, upload.single("file"), async (req, res) => {
  try {
    const admin = await requireHSAdmin(req);
    if (!admin) return res.status(403).json({ message: "Access denied" });

    const student = await loadStudentInSameSchool(req.params.id, admin.institution);
    if (!student) return res.status(404).json({ message: "Student not found" });
    if (student === "FORBIDDEN") return res.status(403).json({ message: "Access denied" });

    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const { type, title } = req.body;

    const doc = await HighSchoolStudentDocument.create({
      student: student._id,
      institution: admin.institution,
      type,
      title: title || req.file.originalname,
      fileUrl: `/${req.file.path.replace(/\\/g, "/")}`,
      originalName: req.file.originalname,
      uploadedBy: req.user.id,
    });

    res.status(201).json(doc);
  } catch (err) {
    console.error("HS DOC UPLOAD ERROR:", err);
    res.status(500).json({ message: "Failed to upload document" });
  }
});

/**
 * DOCUMENTS: DELETE
 */
router.delete("/documents/:docId", auth, async (req, res) => {
  try {
    const admin = await requireHSAdmin(req);
    if (!admin) return res.status(403).json({ message: "Access denied" });

    const doc = await HighSchoolStudentDocument.findById(req.params.docId);
    if (!doc) return res.status(404).json({ message: "Not found" });

    if (String(doc.institution) !== String(admin.institution)) {
      return res.status(403).json({ message: "Access denied" });
    }

    await HighSchoolStudentDocument.findByIdAndDelete(req.params.docId);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("HS DOC DELETE ERROR:", err);
    res.status(500).json({ message: "Failed to delete document" });
  }
});

export default router;
