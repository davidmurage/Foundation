// routes/reports.js
import express from "express";
import auth, { requireRole } from "../middleware/auth.js";
<<<<<<< HEAD
=======
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

>>>>>>> Chats

import Institution from "../models/Institution.js";
import InstitutionReport from "../models/InstitutionReport.js";

// University / TVET
import StudentProfile from "../models/StudentProfile.js";
import StudentDocument from "../models/StudentDocument.js";
import Performance from "../models/Performance.js";
import FeeApplication from "../models/FeesApplication.js";

// High School
import HighSchoolStudent from "../models/HighSchoolStudent.js";
import HighSchoolStudentDocument from "../models/HighSchoolStudentDocument.js";
import HighSchoolStudentFeeRecord from "../models/HighSchoolStudentFeeRecord.js";
import HighSchoolFeeTransaction from "../models/HighSchoolFeeTransaction.js";

const router = express.Router();

/* ======================================================
   DATASET BUILDERS
====================================================== */
async function buildDataset(institutionId) {
  const institution = await Institution.findById(institutionId).lean();
  if (!institution) throw new Error("Institution not found");

  if (institution.type === "HighSchool") {
    return buildHighSchoolDataset(institution);
  }
  return buildUniversityDataset(institution);
}

/* ---------- UNIVERSITY / TVET ---------- */
async function buildUniversityDataset(institution) {
  const students = await StudentProfile.find({
    institution: institution._id,
  }).lean();

  const userIds = students.map(s => s.userId);

  return {
    institution,
    type: institution.type,
    students,
    documents: await StudentDocument.find({ userId: { $in: userIds } }).lean(),
    performances: await Performance.find({ userId: { $in: userIds } }).lean(),
    fees: await FeeApplication.find({ userId: { $in: userIds } }).lean(),
  };
}

/* ---------- HIGH SCHOOL ---------- */
async function buildHighSchoolDataset(institution) {
  const students = await HighSchoolStudent.find({
    institution: institution._id,
  }).lean();

  return {
    institution,
    type: "HighSchool",
    students,
    documents: await HighSchoolStudentDocument.find({
      institution: institution._id,
    }).lean(),
    feeRecords: await HighSchoolStudentFeeRecord.find({
      institution: institution._id,
    }).lean(),
    transactions: await HighSchoolFeeTransaction.find({
      institution: institution._id,
    }).lean(),
  };
}

/* ======================================================
   ANALYSIS
====================================================== */
function analyze(ds) {
  return ds.type === "HighSchool"
    ? analyzeHighSchool(ds)
    : analyzeUniversity(ds);
}

/* ---------- UNIVERSITY / TVET ---------- */
function analyzeUniversity(ds) {
  const studentsSnapshot = ds.students.map((s) => ({
    admissionNo: s.admissionNo || "",
    fullName: s.fullName || "",
    course: s.course || "",
    year: s.year || "",
  }));

  const studentsByYear = {};
  ds.students.forEach((s) => {
    const y = s.year || "Unknown";
    studentsByYear[y] = (studentsByYear[y] || 0) + 1;
  });

  const docsByType = {};
  ds.documents.forEach((d) => {
    const t = d.documentType || "Unknown";
    docsByType[t] = (docsByType[t] || 0) + 1;
  });

  const gpas = ds.performances.map((p) => p.gpa).filter(Number.isFinite);
  const averageScore = gpas.length
    ? Number((gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(2))
    : null;

  return {
    overview: {
      institution: ds.institution.name,
      type: ds.type,
      totalStudents: ds.students.length,
      totalDocuments: ds.documents.length,
      averageScore,
    },
    students: studentsSnapshot,
    breakdowns: {
      students: studentsByYear,
      documents: docsByType,
    },
    fees: {
      totalApplications: ds.fees.length,
    },
    recommendations: [
      averageScore !== null && averageScore < 2.8
        ? "Introduce academic intervention programs."
        : "Maintain current academic strategies.",
      "Improve document compliance.",
    ],
  };
}

/* ---------- HIGH SCHOOL ---------- */
function analyzeHighSchool(ds) {
  const studentsSnapshot = ds.students.map((s) => ({
    admissionNo: s.registrationNo || "",
    fullName: s.fullName || "",
    class: s.level || s.level || "",
  }));

  const studentsByClass = {};
  ds.students.forEach((s) => {
    const c = s.level || s.level || "Unknown";
    studentsByClass[c] = (studentsByClass[c] || 0) + 1;
  });

  const totalExpected = ds.feeRecords.reduce(
    (a, r) => a + (r.totalFees || 0),
    0
  );
  const totalPaid = ds.feeRecords.reduce(
    (a, r) => a + (r.paidAmount || 0),
    0
  );

  return {
    overview: {
      institution: ds.institution.name,
      type: "HighSchool",
      totalStudents: ds.students.length,
      totalDocuments: ds.documents.length,
      averageScore: null,
    },
    students: studentsSnapshot,
    breakdowns: {
      students: studentsByClass,
    },
    fees: {
      expected: totalExpected,
      paid: totalPaid,
    },
    recommendations: [
      "Strengthen fee reconciliation.",
      "Implement early academic intervention tracking.",
    ],
  };
}


/* ======================================================
   ROUTES
====================================================== */

/* ---------- Institutions ---------- */
router.get("/institutions", auth, requireRole("admin"), async (req, res) => {
  const filter = req.query.type ? { type: req.query.type } : {};
  const list = await Institution.find(filter).sort({ name: 1 }).lean();
  res.json(list);
});

/* ---------- Generate ---------- */
router.post("/generate", auth, requireRole("admin"), async (req, res) => {
  try {
    const dataset = await buildDataset(req.body.institutionId);
    const analysis = analyze(dataset);

    const report = await InstitutionReport.create({
      institution: dataset.institution._id,
      institutionType: dataset.type,
      analysis,
      generatedBy: req.user.id,
    });

    const populated = await InstitutionReport.findById(report._id)
      .populate("institution", "name type")
      .lean();

    res.json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

/* ---------- History (FIXED) ---------- */
router.get("/history", auth, requireRole("admin"), async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 30);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.type) filter.institutionType = req.query.type;

  const total = await InstitutionReport.countDocuments(filter);
  const items = await InstitutionReport.find(filter)
    .populate("institution", "name type")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  res.json({
    items,
    page,
    pages: Math.ceil(total / limit),
  });
});

/* ---------- Single ---------- */
router.get("/report/:id", auth, requireRole("admin"), async (req, res) => {
  const report = await InstitutionReport.findById(req.params.id)
    .populate("institution", "name type")
    .lean();

  if (!report) return res.status(404).json({ message: "Not found" });
  res.json(report);
});

<<<<<<< HEAD
=======
router.get(
  "/report/:id/download/pdf",
  auth,
  requireRole("admin"),
  async (req, res) => {
    let doc;

    try {
      const report = await InstitutionReport.findById(req.params.id)
        .populate("institution", "name type")
        .lean();

      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      // ---------- SAFE NORMALIZATION ----------
      const institutionName = report.institution?.name || "Institution";
      const analysis = report.analysis || {};
      const students = analysis.students || [];
      const fees = analysis.fees || {};

      const expected = Number(fees.expected || 0);
      const paid = Number(fees.paid || 0);
      const balance = expected - paid;

      // ---------- HEADERS ----------
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${institutionName.replace(/[^\w\-]+/g, "_")}_Report.pdf"`
      );

      // ---------- PDF ----------
      doc = new PDFDocument({ margin: 40, size: "A4" });
      doc.pipe(res);

      // ---------- TITLE ----------
      doc.fontSize(18).text(institutionName, { underline: true });
      doc.moveDown(0.5);

      doc.fontSize(11);
      doc.text(`Institution Type: ${report.institutionType}`);
      doc.text(`Generated At: ${new Date(report.createdAt).toLocaleString()}`);
      doc.moveDown();

      // ---------- STUDENTS ----------
      doc.fontSize(14).text("Students");
      doc.moveDown(0.5);

      if (students.length === 0) {
        doc.fontSize(10).text("No student data available.");
      } else {
        students.forEach((s, i) => {
          doc.fontSize(10).text(
            `${i + 1}. ${s.fullName || "—"} | ${s.admissionNo || "—"} | ${
              s.class || s.course || "—"
            }`
          );
        });
      }

      doc.moveDown();

      // ---------- FINANCIALS ----------
      doc.fontSize(14).text("Financial Summary");
      doc.moveDown(0.5);

      doc.fontSize(11).text(
        `Total Expected: KES ${expected.toLocaleString()}`
      );
      doc.text(`Total Paid: KES ${paid.toLocaleString()}`);
      doc.text(`Outstanding Balance: KES ${balance.toLocaleString()}`);

      doc.moveDown();

      // ---------- FOOTER ----------
      doc
        .fontSize(9)
        .fillColor("gray")
        .text(
          "This document is system-generated and valid without signature.",
          { align: "center" }
        );

      doc.end();
    } catch (err) {
      console.error("PDF ERROR:", err);

      // IMPORTANT: only respond if headers not sent
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to generate PDF" });
      }

      // IMPORTANT: safely end PDF stream if open
      if (doc && !doc.ended) {
        try {
          doc.end();
        } catch (_) {}
      }
    }
  }
);


router.get("/report/:id/download/excel", auth, requireRole("admin"), async (req, res) => {
  const report = await InstitutionReport.findById(req.params.id)
    .populate("institution", "name type")
    .lean();

  if (!report) return res.status(404).end();

  const wb = new ExcelJS.Workbook();

  // Students sheet
  const studentsSheet = wb.addWorksheet("Students");
  studentsSheet.columns = [
    { header: "Admission No", key: "admissionNo" },
    { header: "Name", key: "fullName" },
    { header: "Class / Course", key: "class" },
  ];

  report.analysis.students.forEach((s) => {
    studentsSheet.addRow({
      admissionNo: s.admissionNo,
      fullName: s.fullName,
      class: s.class || s.course || "",
    });
  });

  // Finance sheet
  const financeSheet = wb.addWorksheet("Finance");
  financeSheet.addRow(["Expected", report.analysis.fees.expected]);
  financeSheet.addRow(["Paid", report.analysis.fees.paid]);
  financeSheet.addRow(["Balance", report.analysis.fees.balance]);

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${report.institution.name}_Report.xlsx"`
  );
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

  await wb.xlsx.write(res);
  res.end();
});


>>>>>>> Chats
export default router;
