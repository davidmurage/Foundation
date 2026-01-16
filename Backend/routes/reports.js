import express from "express";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

import auth, { requireRole } from "../middleware/auth.js";

import Institution from "../models/Institution.js";
import StudentProfile from "../models/StudentProfile.js";
import StudentDocument from "../models/StudentDocument.js";
import Performance from "../models/Performance.js";
import FeeApplication from "../models/FeesApplication.js";
import User from "../models/User.js";
import InstitutionReport from "../models/InstitutionReport.js";

const router = express.Router();

/* -----------------------------
   Helpers
------------------------------ */
function safeNumber(n, fallback = 0) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

function normalizeType(t) {
  const x = String(t || "").toLowerCase();
  if (x.includes("university")) return "University";
  if (x.includes("tvet") || x.includes("college")) return "TVET";
  if (x.includes("high")) return "HighSchool";
  return "";
}

function gradeBucket(grade) {
  // Highschool-style grades (adjust if your system uses different grading)
  const g = String(grade || "").trim().toUpperCase();
  if (!g) return "Unknown";
  if (["A", "A-", "A+"].includes(g)) return "A";
  if (["B+", "B", "B-"].includes(g)) return "B";
  if (["C+", "C", "C-"].includes(g)) return "C";
  if (["D+", "D", "D-"].includes(g)) return "D";
  if (["E"].includes(g)) return "E";
  return "Other";
}

/**
 * IMPORTANT:
 * Your StudentProfile might store institution in different ways:
 * - institutionId (ObjectId)
 * - institution (string name)
 * - institutionName (string name)
 *
 * We support all safely.
 */
async function buildInstitutionDataset(institutionId) {
  const institution = await Institution.findById(institutionId).lean();
  if (!institution) throw new Error("Institution not found");

  const institutionType = normalizeType(institution.type);

  let profiles = [];

  if (institutionType === "HighSchool") {
    const instName = institution.name;

    // DO NOT TOUCH ObjectId FIELDS
    profiles = await StudentProfile.find({
      $or: [
        { institutionName: instName },
        { schoolName: instName },
        { highSchoolName: instName },
        { school: instName },
        { highSchool: instName }
      ]
    }).lean();

    console.log("HIGHSCHOOL FIXED", {
      institution: instName,
      profiles: profiles.length
    });
  } else {
    // University / TVET — ObjectId is correct
    profiles = await StudentProfile.find({
      institution: institution._id
    }).lean();
  }

  const userIds = profiles.map(p => p.userId).filter(Boolean);

  const users = await User.find({ _id: { $in: userIds } }).lean();
  const userMap = new Map(users.map(u => [String(u._id), u]));

  const documents = await StudentDocument.find({ userId: { $in: userIds } }).lean();
  const performances = await Performance.find({ userId: { $in: userIds } }).lean();
  const fees = await FeeApplication.find({ userId: { $in: userIds } }).lean();

  console.log("DATASET FINAL", {
    institution: institution.name,
    profiles: profiles.length,
    documents: documents.length,
    performances: performances.length,
    fees: fees.length
  });

  return {
    institution,
    institutionType,
    profiles,
    userIds,
    userMap,
    documents,
    performances,
    fees
  };
}

/* -----------------------------
   Analytics Builders
------------------------------ */
function analyzeUniversityOrTVET(ds) {
  const { profiles, documents, performances, fees, userMap } = ds;

  /* ---------------- Students ---------------- */
  const studentsByYear = {};
  profiles.forEach(p => {
    const y = String(p.year || p.yearOfStudy || "Unknown");
    studentsByYear[y] = (studentsByYear[y] || 0) + 1;
  });

  /* ---------------- Documents ---------------- */
  const docsByType = {};
  documents.forEach(d => {
    const t = d.documentType || "Unknown";
    docsByType[t] = (docsByType[t] || 0) + 1;
  });

  /* ---------------- GPA ---------------- */
  const gpas = performances.map(p => p.gpa).filter(g => g != null);
  const avgGpa = gpas.length
    ? Number((gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(2))
    : null;

  /* ---------------- Fees ---------------- */
  const feeStats = {
    totalApplications: fees.length,
    byReviewStatus: {},
    byProcessingStatus: {},
  };

  fees.forEach(f => {
    const rs = f.reviewStatus || "unknown";
    const ps = f.processingStatus || "unknown";

    feeStats.byReviewStatus[rs] =
      (feeStats.byReviewStatus[rs] || 0) + 1;

    feeStats.byProcessingStatus[ps] =
      (feeStats.byProcessingStatus[ps] || 0) + 1;
  });

  return {
    overview: {
      totalStudents: profiles.length,
      totalDocuments: documents.length,
      avgGpa,
    },
    studentsByYear,
    docsByType,
    feeStats,
    recommendations: [
      avgGpa !== null && avgGpa < 2.8
        ? "Introduce academic intervention programs."
        : "Maintain current academic performance strategies.",
      "Improve transcript submission compliance.",
      "Digitize and automate fee review workflows.",
    ],
  };
}


function analyzeHighSchool(ds) {
  const { profiles, documents, performances, fees, userMap } = ds;

  /* ---------------- STUDENTS BY FORM ---------------- */
  const studentsByForm = {};
  profiles.forEach(p => {
    const form =
      p.form ||
      p.year ||
      p.class ||
      "Unknown";

    studentsByForm[form] = (studentsByForm[form] || 0) + 1;
  });

  /* ---------------- DOCUMENTS ---------------- */
  const docsByType = {};
  documents.forEach(d => {
    const t = d.documentType || "Unknown";
    docsByType[t] = (docsByType[t] || 0) + 1;
  });

  /* ---------------- PERFORMANCE ---------------- */
  const scores = performances
    .map(p =>
      p.meanScore ??
      p.rawAverage ??
      p.average ??
      null
    )
    .filter(v => typeof v === "number");

  const avgMeanScore = scores.length
    ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
    : null;

  /* ---------------- GRADE DISTRIBUTION ---------------- */
  const gradeDistribution = {};
  performances.forEach(p => {
    const g = p.grade || p.meanGrade;
    if (!g) return;
    const bucket = gradeBucket(g);
    gradeDistribution[bucket] = (gradeDistribution[bucket] || 0) + 1;
  });

  /* ---------------- FEES (OPTIONAL) ---------------- */
  const feeStats = {
    totalApplications: fees.length,
    byReviewStatus: {},
    byProcessingStatus: {},
  };

  fees.forEach(f => {
    if (f.reviewStatus) {
      feeStats.byReviewStatus[f.reviewStatus] =
        (feeStats.byReviewStatus[f.reviewStatus] || 0) + 1;
    }
    if (f.status) {
      feeStats.byProcessingStatus[f.status] =
        (feeStats.byProcessingStatus[f.status] || 0) + 1;
    }
  });

  /* ---------------- RISK STUDENTS ---------------- */
  const riskStudents = performances
    .filter(p => {
      const score =
        p.meanScore ??
        p.rawAverage ??
        null;
      return typeof score === "number" && score < 50;
    })
    .map(p => ({
      name: userMap.get(String(p.userId))?.fullName || "Unknown",
      admissionNo: p.admissionNo,
      meanScore: p.meanScore ?? p.rawAverage,
      reason: "Low academic performance",
    }));

  return {
    overview: {
      totalStudents: profiles.length,
      totalDocuments: documents.length,
      avgMeanScore,
    },
    studentsByForm,
    docsByType,
    gradeDistribution,
    feeStats,
    riskStudents,
    recommendations: [
      avgMeanScore !== null && avgMeanScore < 50
        ? "Introduce remedial and mentorship programs."
        : "Maintain current academic support programs.",
      "Improve report-card and transcript upload compliance.",
      "Strengthen early-warning systems for at-risk students.",
    ],
  };
}



/* -----------------------------
   PDF Generator
------------------------------ */
function writePdf(res, title, dataset, analysis) {
  const doc = new PDFDocument({ margin: 40 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${title}.pdf"`);

  doc.pipe(res);

  // Header
  doc.fontSize(18).text(title, { underline: true });
  doc.moveDown(0.5);

  doc.fontSize(11).text(`Generated on: ${new Date().toLocaleString()}`);
  doc.moveDown(1);

  // Institution summary
  doc.fontSize(14).text("1) Institution Overview", { underline: true });
  doc.moveDown(0.3);

  doc.fontSize(11).text(`Institution: ${dataset.institution.name}`);
  doc.text(`Type: ${dataset.institutionType || "Unknown"}`);
  doc.moveDown(0.5);

  Object.entries(analysis.overview || {}).forEach(([k, v]) => {
    doc.text(`${k}: ${v === null ? "N/A" : String(v)}`);
  });

  doc.moveDown(1);

  // Key analytics blocks
  doc.fontSize(14).text("2) Key Analytics", { underline: true });
  doc.moveDown(0.3);

  const sections = [
    ["Students by Year/Form", analysis.studentsByYear || analysis.studentsByForm],
    ["Documents by Type", analysis.docsByType],
    ["GPA by Year", analysis.gpaByYear],
    ["Grade Distribution", analysis.gradeDistribution],
  ];

  for (const [name, obj] of sections) {
    if (!obj) continue;
    doc.fontSize(12).text(name, { underline: true });
    doc.moveDown(0.2);

    if (Array.isArray(obj)) {
      obj.forEach((row) => doc.fontSize(10).text(JSON.stringify(row)));
    } else {
      Object.entries(obj).forEach(([k, v]) => doc.fontSize(10).text(`${k}: ${v}`));
    }
    doc.moveDown(0.6);
  }

  // Fees
  if (analysis.feeStats) {
    doc.fontSize(12).text("Fees Summary", { underline: true });
    doc.moveDown(0.2);
    doc.fontSize(10).text(`Total applications: ${analysis.feeStats.totalApplications || 0}`);
    doc.text("By review status:");
    Object.entries(analysis.feeStats.byReviewStatus || {}).forEach(([k, v]) => doc.text(`- ${k}: ${v}`));
    doc.moveDown(0.2);
    doc.text("By processing status:");
    Object.entries(analysis.feeStats.byProcessingStatus || {}).forEach(([k, v]) => doc.text(`- ${k}: ${v}`));
    doc.moveDown(0.8);
  }

  // Top students
  if (analysis.topStudents && analysis.topStudents.length) {
    doc.fontSize(12).text("Top Students (Performance Highlights)", { underline: true });
    doc.moveDown(0.2);
    analysis.topStudents.forEach((s, idx) => {
      doc.fontSize(10).text(
        `${idx + 1}. ${s.name} (${s.email}) | Year: ${s.yearOfStudy} | ${s.period} | GPA: ${s.gpa}`
      );
    });
    doc.moveDown(0.8);
  }

  // Risks
  if (analysis.riskStudents && analysis.riskStudents.length) {
    doc.fontSize(12).text("Risk / Compliance Alerts", { underline: true });
    doc.moveDown(0.2);
    analysis.riskStudents.forEach((r, idx) => {
      doc.fontSize(10).text(`${idx + 1}. ${r.name} | ${r.admissionNo} | ${r.reason}`);
    });
    doc.moveDown(0.8);
  }

  // Recommendations
  if (analysis.recommendations && analysis.recommendations.length) {
    doc.fontSize(12).text("Recommendations", { underline: true });
    doc.moveDown(0.2);
    analysis.recommendations.forEach((rec, idx) => doc.fontSize(10).text(`${idx + 1}. ${rec}`));
  }

  doc.end();
}

/* -----------------------------
   Excel Generator
------------------------------ */
async function writeExcel(res, title, dataset, analysis) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "KCB Portal Reports";

  const ws1 = wb.addWorksheet("Overview");
  ws1.addRow(["Institution", dataset.institution.name]);
  ws1.addRow(["Type", dataset.institutionType || "Unknown"]);
  ws1.addRow(["Generated On", new Date().toLocaleString()]);
  ws1.addRow([]);

  ws1.addRow(["Metric", "Value"]);
  Object.entries(analysis.overview || {}).forEach(([k, v]) => ws1.addRow([k, v === null ? "N/A" : v]));

  // Students by year/form
  const wsStudents = wb.addWorksheet("Students by Year");
  wsStudents.addRow(["Year/Form", "Count"]);
  const byYear = analysis.studentsByYear || analysis.studentsByForm || {};
  Object.entries(byYear).forEach(([k, v]) => wsStudents.addRow([k, v]));

  // Documents by type
  const wsDocs = wb.addWorksheet("Documents by Type");
  wsDocs.addRow(["Document Type", "Count"]);
  Object.entries(analysis.docsByType || {}).forEach(([k, v]) => wsDocs.addRow([k, v]));

  // GPA by year
  if (analysis.gpaByYear) {
    const wsGpa = wb.addWorksheet("GPA by Year");
    wsGpa.addRow(["Year", "Avg GPA", "Count"]);
    analysis.gpaByYear.forEach((r) => wsGpa.addRow([r.year, r.avgGpa, r.count]));
  }

  // Grade distribution
  if (analysis.gradeDistribution) {
    const wsGrades = wb.addWorksheet("Grade Distribution");
    wsGrades.addRow(["Grade Bucket", "Count"]);
    Object.entries(analysis.gradeDistribution).forEach(([k, v]) => wsGrades.addRow([k, v]));
  }

  // Fees
  if (analysis.feeStats) {
    const wsFees = wb.addWorksheet("Fees Summary");
    wsFees.addRow(["Total Applications", analysis.feeStats.totalApplications || 0]);
    wsFees.addRow([]);
    wsFees.addRow(["Review Status", "Count"]);
    Object.entries(analysis.feeStats.byReviewStatus || {}).forEach(([k, v]) => wsFees.addRow([k, v]));
    wsFees.addRow([]);
    wsFees.addRow(["Processing Status", "Count"]);
    Object.entries(analysis.feeStats.byProcessingStatus || {}).forEach(([k, v]) => wsFees.addRow([k, v]));
  }

  // Top students
  if (analysis.topStudents && analysis.topStudents.length) {
    const wsTop = wb.addWorksheet("Top Students");
    wsTop.addRow(["Name", "Email", "Year", "Period", "GPA"]);
    analysis.topStudents.forEach((s) => wsTop.addRow([s.name, s.email, s.yearOfStudy, s.period, s.gpa]));
  }

  // Risk students
  if (analysis.riskStudents && analysis.riskStudents.length) {
    const wsRisk = wb.addWorksheet("Risk Alerts");
    wsRisk.addRow(["Name", "Email", "Admission", "Reason", "Score/GPA"]);
    analysis.riskStudents.forEach((r) => wsRisk.addRow([
      r.name,
      r.email,
      r.admissionNo,
      r.reason,
      r.gpa ?? r.meanScore ?? "",
    ]));
  }

  // Recommendations
  if (analysis.recommendations && analysis.recommendations.length) {
    const wsRec = wb.addWorksheet("Recommendations");
    wsRec.addRow(["#","Recommendation"]);
    analysis.recommendations.forEach((rec, idx) => wsRec.addRow([idx + 1, rec]));
  }

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename="${title}.xlsx"`);

  await wb.xlsx.write(res);
  res.end();
}

/* -----------------------------
   ROUTES
------------------------------ */

/**
 * GET /api/reports/institutions?type=University|TVET|HighSchool
 * Returns institutions for dropdown
 */
router.get("/institutions", auth, requireRole("admin"), async (req, res) => {
  try {
    const type = normalizeType(req.query.type);
    const filter = {};
    if (type) filter.type = type; // depends on your Institution schema
    const list = await Institution.find(filter).sort({ name: 1 }).lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Failed to load institutions" });
  }
});

/**
 * GET /api/reports/institution/:institutionId/summary
 * Returns analysis JSON preview
 */
router.get(
  "/institution/:institutionId/summary",
  auth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const dataset = await buildInstitutionDataset(req.params.institutionId);

      let analysis;
      if (dataset.institutionType === "HighSchool") {
        analysis = analyzeHighSchool(dataset);
      } else {
        analysis = analyzeUniversityOrTVET(dataset);
      }

      // SAVE REPORT
      const report = await InstitutionReport.create({
        institution: dataset.institution._id,
        institutionType: dataset.institutionType,
        analysis,
        generatedBy: req.user.id,
      });

      res.json({
        reportId: report._id,
        institution: dataset.institution,
        institutionType: dataset.institutionType,
        analysis,
        createdAt: report.createdAt,
      });
    } catch (err) {
      console.error("REPORT SUMMARY ERROR:", err);
      res.status(err.status || 500).json({
        message: err.message || "Server error",
      });
    }
  }
);



/**
 * GET /api/reports/institution/:institutionId/download/pdf
 */
router.get("/institution/:institutionId/download/pdf", auth, requireRole("admin"), async (req, res) => {
  try {
    const dataset = await buildInstitutionDataset(req.params.institutionId);

    let analysis;
    if (dataset.institutionType === "HighSchool") {
      analysis = analyzeHighSchool(dataset);
    } else {
      analysis = analyzeUniversityOrTVET(dataset);
    }

    const safeName = dataset.institution.name.replace(/[^\w\-]+/g, "_");
    const title = `${safeName}_Institution_Report`;

    writePdf(res, title, dataset, analysis);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Server error" });
  }
});

/**
 * GET /api/reports/institution/:institutionId/download/excel
 */
router.get("/institution/:institutionId/download/excel", auth, requireRole("admin"), async (req, res) => {
  try {
    const dataset = await buildInstitutionDataset(req.params.institutionId);

    let analysis;
    if (dataset.institutionType === "HighSchool") {
      analysis = analyzeHighSchool(dataset);
    } else {
      analysis = analyzeUniversityOrTVET(dataset);
    }

    const safeName = dataset.institution.name.replace(/[^\w\-]+/g, "_");
    const title = `${safeName}_Institution_Report`;

    await writeExcel(res, title, dataset, analysis);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message || "Server error" });
  }
});

//Reports per ID 
router.get(
  "/report/:reportId",
  auth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const report = await InstitutionReport.findById(req.params.reportId)
        .populate("institution", "name type")
        .lean();

      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      res.json({
        _id: report._id,
        institution: report.institution,
        institutionType: report.institutionType,
        analysis: report.analysis,
        createdAt: report.createdAt,
      });
    } catch (err) {
      console.error("LOAD REPORT ERROR:", err);
      res.status(500).json({ message: "Failed to load report" });
    }
  }
);



//Get reports History
router.get(
  "/history",
  auth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { type, from, to } = req.query;

      const filter = {};
      if (type) filter.institutionType = type;
      if (from || to) {
        filter.createdAt = {};
        if (from) filter.createdAt.$gte = new Date(from);
        if (to) filter.createdAt.$lte = new Date(to);
      }

      const reports = await InstitutionReport.find(filter)
        .populate("institution", "name")
        .sort({ createdAt: -1 })
        .lean();

      res.json(reports);
    } catch {
      res.status(500).json({ message: "Failed to load reports" });
    }
  }
);

export default router;
