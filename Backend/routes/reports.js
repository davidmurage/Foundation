// routes/reports.js
import express from "express";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

import auth, { requireRole } from "../middleware/auth.js";
import Institution from "../models/Institution.js";
import InstitutionReport from "../models/InstitutionReport.js";
import User from "../models/User.js";

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

const money = (value) => Number(value || 0);
const sum = (items, selector) => items.reduce((total, item) => total + money(selector(item)), 0);

function countBy(items, selector) {
  return items.reduce((acc, item) => {
    const key = selector(item) || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function statusSummary(items, selector) {
  return countBy(items, (item) => selector(item) || "pending");
}

function average(numbers) {
  const clean = numbers.filter((n) => Number.isFinite(n));
  return clean.length
    ? Number((clean.reduce((a, b) => a + b, 0) / clean.length).toFixed(2))
    : null;
}

function reportTitle(analysis) {
  return analysis?.overview?.title || analysis?.overview?.institution || "Report";
}

function institutionFilterForScope({ scope, institutionId }) {
  if (scope === "institution") return { _id: institutionId };
  if (scope === "campus") return { type: { $in: ["University", "TVET"] } };
  if (scope === "highschool") return { type: "HighSchool" };
  return {};
}

async function loadInstitutions({ scope = "institution", institutionId }) {
  const institutions = await Institution.find(
    institutionFilterForScope({ scope, institutionId })
  )
    .sort({ type: 1, name: 1 })
    .lean();

  if (scope === "institution" && !institutions.length) {
    throw new Error("Institution not found");
  }

  return institutions;
}

async function buildReportSnapshot({ scope = "institution", institutionId }) {
  const institutions = await loadInstitutions({ scope, institutionId });
  const campusInstitutions = institutions.filter((i) => ["University", "TVET"].includes(i.type));
  const highSchoolInstitutions = institutions.filter((i) => i.type === "HighSchool");

  const campus = await buildCampusSection(campusInstitutions);
  const highSchool = await buildHighSchoolSection(highSchoolInstitutions);

  let title = "All Institutions Report";
  let institutionType = "All";
  let institution = null;

  if (scope === "institution") {
    institution = institutions[0];
    title = `${institution.name} Report`;
    institutionType = institution.type;
  } else if (scope === "campus") {
    title = "University & TVET General Report";
    institutionType = "Campus";
  } else if (scope === "highschool") {
    title = "High School General Report";
    institutionType = "HighSchool";
  }

  const totals = {
    institutions: institutions.length,
    campusInstitutions: campusInstitutions.length,
    highSchoolInstitutions: highSchoolInstitutions.length,
    students: campus.overview.totalStudents + highSchool.overview.totalStudents,
    documents: campus.overview.totalDocuments + highSchool.overview.totalDocuments,
    feeApplications: campus.finance.totalApplications,
    highSchoolFeeRecords: highSchool.finance.totalRecords,
  };

  return {
    institution,
    institutionType,
    analysis: {
      overview: {
        title,
        scope,
        institution: institution?.name || title,
        type: institutionType,
        generatedAt: new Date().toISOString(),
        totalInstitutions: totals.institutions,
        totalStudents: totals.students,
        totalDocuments: totals.documents,
      },
      totals,
      institutionSummaries: [...campus.institutionSummaries, ...highSchool.institutionSummaries],
      campus,
      highSchool,
      students: [...campus.students, ...highSchool.students],
      documents: [...campus.documents, ...highSchool.documents],
      finance: {
        campus: campus.finance,
        highSchool: highSchool.finance,
      },
      recommendations: buildRecommendations(campus, highSchool, scope),
    },
  };
}

async function buildCampusSection(institutions) {
  const institutionIds = institutions.map((i) => i._id);
  const profiles = await StudentProfile.find({ institution: { $in: institutionIds } }).lean();
  const userIds = profiles.map((p) => p.userId);
  const users = await User.find({ _id: { $in: userIds } }).select("_id fullName email").lean();
  const userMap = new Map(users.map((u) => [String(u._id), u]));
  const institutionMap = new Map(institutions.map((i) => [String(i._id), i]));

  const [documents, performances, fees] = await Promise.all([
    StudentDocument.find({ userId: { $in: userIds } }).lean(),
    Performance.find({ userId: { $in: userIds } }).lean(),
    FeeApplication.find({ userId: { $in: userIds } }).lean(),
  ]);

  const perfByUser = new Map();
  performances.forEach((p) => {
    const key = String(p.userId);
    if (!perfByUser.has(key)) perfByUser.set(key, []);
    perfByUser.get(key).push(p);
  });

  const students = profiles.map((p) => {
    const inst = institutionMap.get(String(p.institution));
    const studentPerf = perfByUser.get(String(p.userId)) || [];
    return {
      category: "Campus",
      institution: inst?.name || p.institutionName || "",
      institutionType: p.institutionType,
      fullName: userMap.get(String(p.userId))?.fullName || "",
      email: userMap.get(String(p.userId))?.email || "",
      admissionNo: p.admissionNo || "",
      course: p.course || "",
      year: p.year || "",
      academicPeriod: p.academicPeriod || "",
      status: p.status || "pending",
      averageGpa: average(studentPerf.map((row) => row.gpa)),
    };
  });

  const institutionSummaries = institutions.map((inst) => {
    const instStudents = profiles.filter((p) => String(p.institution) === String(inst._id));
    const instUserIds = new Set(instStudents.map((p) => String(p.userId)));
    const instDocs = documents.filter((d) => instUserIds.has(String(d.userId)));
    const instPerf = performances.filter((p) => instUserIds.has(String(p.userId)));
    const instFees = fees.filter((f) => String(f.institutionId) === String(inst._id));
    return {
      institution: inst.name,
      type: inst.type,
      county: inst.county || "",
      location: inst.location || "",
      totalStudents: instStudents.length,
      totalDocuments: instDocs.length,
      averageGpa: average(instPerf.map((p) => p.gpa)),
      feeApplications: instFees.length,
      amountRequested: sum(instFees, (f) => f.amountRequested),
    };
  });

  return {
    overview: {
      totalInstitutions: institutions.length,
      totalStudents: profiles.length,
      totalDocuments: documents.length,
      averageGpa: average(performances.map((p) => p.gpa)),
    },
    students,
    documents: documents.map((d) => ({
      category: "Campus",
      admissionNo: d.admissionNo || "",
      institutionType: d.institutionType || "",
      yearOfStudy: d.yearOfStudy || "",
      academicPeriod: d.academicPeriod || "",
      documentType: d.documentType || "",
      uploadedAt: d.createdAt,
    })),
    performance: {
      totalRecords: performances.length,
      completedRecords: performances.filter((p) => p.status === "complete").length,
      averageGpa: average(performances.map((p) => p.gpa)),
      byYear: countBy(performances, (p) => p.yearOfStudy),
      byPeriod: countBy(performances, (p) => p.academicPeriod),
    },
    finance: {
      totalApplications: fees.length,
      amountRequested: sum(fees, (f) => f.amountRequested),
      byReviewStatus: statusSummary(fees, (f) => f.reviewStatus),
      byProcessingStatus: statusSummary(fees, (f) => f.processingStatus),
    },
    breakdowns: {
      studentsByType: countBy(profiles, (p) => p.institutionType),
      studentsByYear: countBy(profiles, (p) => p.year),
      profileStatus: statusSummary(profiles, (p) => p.status),
      documentsByType: countBy(documents, (d) => d.documentType),
    },
    institutionSummaries,
  };
}

async function buildHighSchoolSection(institutions) {
  const institutionIds = institutions.map((i) => i._id);
  const institutionMap = new Map(institutions.map((i) => [String(i._id), i]));

  const [studentsRaw, documents, feeRecords, transactions] = await Promise.all([
    HighSchoolStudent.find({ institution: { $in: institutionIds } }).lean(),
    HighSchoolStudentDocument.find({ institution: { $in: institutionIds } }).lean(),
    HighSchoolStudentFeeRecord.find({ institution: { $in: institutionIds } }).lean(),
    HighSchoolFeeTransaction.find({ institution: { $in: institutionIds } }).lean(),
  ]);

  const students = studentsRaw.map((s) => {
    const inst = institutionMap.get(String(s.institution));
    return {
      category: "HighSchool",
      institution: inst?.name || "",
      fullName: s.fullName || "",
      admissionNo: s.registrationNo || "",
      assessmentNo: s.assessmentNo || "",
      indexNo: s.indexNo || "",
      gender: s.gender || "",
      curriculum: s.curriculum || "",
      level: s.level || "",
      academicYear: s.academicYear || "",
      term: s.term || "",
      feesAmount: money(s.feesAmount),
      status: s.sponsorshipStatus || "pending",
    };
  });

  const institutionSummaries = institutions.map((inst) => {
    const instStudents = studentsRaw.filter((s) => String(s.institution) === String(inst._id));
    const instDocs = documents.filter((d) => String(d.institution) === String(inst._id));
    const instFees = feeRecords.filter((f) => String(f.institution) === String(inst._id));
    return {
      institution: inst.name,
      type: "HighSchool",
      county: inst.county || "",
      location: inst.location || "",
      totalStudents: instStudents.length,
      totalDocuments: instDocs.length,
      expectedFees: sum(instFees, (f) => f.totalFees),
      paidFees: sum(instFees, (f) => f.paidAmount),
      balance: sum(instFees, (f) => f.totalFees) - sum(instFees, (f) => f.paidAmount),
    };
  });

  const expected = sum(feeRecords, (f) => f.totalFees);
  const paid = sum(feeRecords, (f) => f.paidAmount);

  return {
    overview: {
      totalInstitutions: institutions.length,
      totalStudents: studentsRaw.length,
      totalDocuments: documents.length,
    },
    students,
    documents: documents.map((d) => ({
      category: "HighSchool",
      title: d.title || d.label || "",
      type: d.type || "",
      uploadedAt: d.createdAt,
    })),
    finance: {
      totalRecords: feeRecords.length,
      expected,
      paid,
      balance: expected - paid,
      transactions: transactions.length,
    },
    breakdowns: {
      studentsByClass: countBy(studentsRaw, (s) => s.level),
      studentsByCurriculum: countBy(studentsRaw, (s) => s.curriculum),
      sponsorshipStatus: statusSummary(studentsRaw, (s) => s.sponsorshipStatus),
      studentsByGender: countBy(studentsRaw, (s) => s.gender),
    },
    institutionSummaries,
  };
}

function buildRecommendations(campus, highSchool, scope) {
  const recommendations = [];
  if (scope !== "highschool") {
    if ((campus.overview.averageGpa || 0) < 2.8 && campus.overview.averageGpa !== null) {
      recommendations.push("Prioritize academic intervention for campus students below target GPA.");
    }
    if ((campus.finance.byReviewStatus?.pending || 0) > 0) {
      recommendations.push("Review pending University/TVET fee applications and profile approvals.");
    }
    recommendations.push("Track document completion by institution and follow up missing academic documents.");
  }

  if (scope !== "campus") {
    if (highSchool.finance.balance > 0) {
      recommendations.push("Reconcile high school fee balances and prioritize schools with the largest outstanding amounts.");
    }
    if ((highSchool.breakdowns.sponsorshipStatus?.pending || 0) > 0) {
      recommendations.push("Review pending high school sponsorship records for approval or correction.");
    }
    recommendations.push("Monitor student distribution by class, curriculum, and gender for balanced sponsorship planning.");
  }

  return recommendations;
}

/* ======================================================
   ROUTES
====================================================== */

router.get("/institutions", auth, requireRole("admin"), async (req, res) => {
  const filter = req.query.type ? { type: req.query.type } : {};
  const list = await Institution.find(filter).sort({ name: 1 }).lean();
  res.json(list);
});

router.post("/generate", auth, requireRole("admin"), async (req, res) => {
  try {
    const scope = req.body.scope || "institution";
    const snapshot = await buildReportSnapshot({
      scope,
      institutionId: req.body.institutionId,
    });

    const report = await InstitutionReport.create({
      institution: snapshot.institution?._id || null,
      institutionType: snapshot.institutionType,
      reportScope: scope,
      analysis: snapshot.analysis,
      generatedBy: req.user.id,
    });

    const populated = await InstitutionReport.findById(report._id)
      .populate("institution", "name type")
      .lean();

    res.json(populated);
  } catch (err) {
    console.error("REPORT GENERATE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

router.get("/history", auth, requireRole("admin"), async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 30);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.type) filter.institutionType = req.query.type;
  if (req.query.scope) filter.reportScope = req.query.scope;
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
  }

  const total = await InstitutionReport.countDocuments(filter);
  const items = await InstitutionReport.find(filter)
    .populate("institution", "name type")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  res.json({ items, page, pages: Math.ceil(total / limit) });
});

router.get("/report/:id", auth, requireRole("admin"), async (req, res) => {
  const report = await InstitutionReport.findById(req.params.id)
    .populate("institution", "name type")
    .lean();

  if (!report) return res.status(404).json({ message: "Not found" });
  res.json(report);
});

router.get("/report/:id/download/pdf", auth, requireRole("admin"), async (req, res) => {
  let doc;
  try {
    const report = await InstitutionReport.findById(req.params.id)
      .populate("institution", "name type")
      .lean();
    if (!report) return res.status(404).json({ message: "Report not found" });

    const analysis = report.analysis || {};
    const title = reportTitle(analysis);
    const students = analysis.students || [];
    const summaries = analysis.institutionSummaries || [];
    const campusFinance = analysis.finance?.campus || {};
    const hsFinance = analysis.finance?.highSchool || {};

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${title.replace(/[^\w\-]+/g, "_")}.pdf"`
    );

    doc = new PDFDocument({ margin: 40, size: "A4" });
    doc.pipe(res);

    doc.fontSize(18).text(title, { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Scope: ${analysis.overview?.scope || report.reportScope}`);
    doc.text(`Type: ${report.institutionType}`);
    doc.text(`Generated: ${new Date(report.createdAt).toLocaleString()}`);
    doc.moveDown();

    doc.fontSize(14).text("Executive Summary");
    doc.fontSize(10);
    doc.text(`Institutions: ${analysis.overview?.totalInstitutions || 0}`);
    doc.text(`Students: ${analysis.overview?.totalStudents || 0}`);
    doc.text(`Documents: ${analysis.overview?.totalDocuments || 0}`);
    doc.moveDown();

    doc.fontSize(14).text("Institution Summary");
    summaries.slice(0, 30).forEach((s, i) => {
      doc.fontSize(9).text(
        `${i + 1}. ${s.institution} (${s.type}) | Students: ${s.totalStudents || 0} | Documents: ${s.totalDocuments || 0}`
      );
    });
    if (summaries.length > 30) doc.text(`...and ${summaries.length - 30} more institutions.`);
    doc.moveDown();

    doc.fontSize(14).text("Financial Summary");
    doc.fontSize(10);
    doc.text(`Campus amount requested: KES ${money(campusFinance.amountRequested).toLocaleString()}`);
    doc.text(`High school expected: KES ${money(hsFinance.expected).toLocaleString()}`);
    doc.text(`High school paid: KES ${money(hsFinance.paid).toLocaleString()}`);
    doc.text(`High school balance: KES ${money(hsFinance.balance).toLocaleString()}`);
    doc.moveDown();

    doc.fontSize(14).text("Student Snapshot");
    students.slice(0, 80).forEach((s, i) => {
      doc.fontSize(8).text(
        `${i + 1}. ${s.fullName || "N/A"} | ${s.institution || "N/A"} | ${s.admissionNo || "N/A"} | ${s.course || s.level || "N/A"}`
      );
    });
    if (students.length > 80) doc.text(`...and ${students.length - 80} more students.`);
    doc.moveDown();

    doc.fontSize(14).text("Recommendations");
    (analysis.recommendations || []).forEach((r, i) => {
      doc.fontSize(10).text(`${i + 1}. ${r}`);
    });

    doc.moveDown();
    doc.fontSize(8).fillColor("gray").text("System-generated report.", { align: "center" });
    doc.end();
  } catch (err) {
    console.error("PDF ERROR:", err);
    if (!res.headersSent) res.status(500).json({ message: "Failed to generate PDF" });
    if (doc && !doc.ended) {
      try { doc.end(); } catch (_) {}
    }
  }
});

router.get("/report/:id/download/excel", auth, requireRole("admin"), async (req, res) => {
  const report = await InstitutionReport.findById(req.params.id)
    .populate("institution", "name type")
    .lean();
  if (!report) return res.status(404).end();

  const analysis = report.analysis || {};
  const wb = new ExcelJS.Workbook();
  wb.creator = "KCB Foundation System";

  const summary = wb.addWorksheet("Summary");
  summary.addRows([
    ["Report", reportTitle(analysis)],
    ["Scope", analysis.overview?.scope || report.reportScope],
    ["Type", report.institutionType],
    ["Generated", new Date(report.createdAt).toLocaleString()],
    ["Total Institutions", analysis.overview?.totalInstitutions || 0],
    ["Total Students", analysis.overview?.totalStudents || 0],
    ["Total Documents", analysis.overview?.totalDocuments || 0],
  ]);

  const instSheet = wb.addWorksheet("Institutions");
  instSheet.columns = [
    { header: "Institution", key: "institution", width: 34 },
    { header: "Type", key: "type", width: 16 },
    { header: "County", key: "county", width: 18 },
    { header: "Location", key: "location", width: 22 },
    { header: "Students", key: "totalStudents", width: 12 },
    { header: "Documents", key: "totalDocuments", width: 12 },
    { header: "Avg GPA", key: "averageGpa", width: 12 },
    { header: "Expected Fees", key: "expectedFees", width: 16 },
    { header: "Paid Fees", key: "paidFees", width: 16 },
    { header: "Balance", key: "balance", width: 16 },
  ];
  (analysis.institutionSummaries || []).forEach((row) => instSheet.addRow(row));

  const studentsSheet = wb.addWorksheet("Students");
  studentsSheet.columns = [
    { header: "Category", key: "category", width: 16 },
    { header: "Institution", key: "institution", width: 34 },
    { header: "Name", key: "fullName", width: 26 },
    { header: "Email", key: "email", width: 26 },
    { header: "Admission/Reg No", key: "admissionNo", width: 18 },
    { header: "Course/Class", key: "course", width: 22 },
    { header: "Level", key: "level", width: 14 },
    { header: "Year", key: "year", width: 12 },
    { header: "Status", key: "status", width: 14 },
    { header: "Avg GPA", key: "averageGpa", width: 12 },
  ];
  (analysis.students || []).forEach((s) => studentsSheet.addRow({ ...s, course: s.course || s.level }));

  const financeSheet = wb.addWorksheet("Finance");
  financeSheet.addRows([
    ["Campus Fee Applications", analysis.finance?.campus?.totalApplications || 0],
    ["Campus Amount Requested", analysis.finance?.campus?.amountRequested || 0],
    ["High School Fee Records", analysis.finance?.highSchool?.totalRecords || 0],
    ["High School Expected", analysis.finance?.highSchool?.expected || 0],
    ["High School Paid", analysis.finance?.highSchool?.paid || 0],
    ["High School Balance", analysis.finance?.highSchool?.balance || 0],
  ]);

  const recommendations = wb.addWorksheet("Recommendations");
  (analysis.recommendations || []).forEach((r, i) => recommendations.addRow([i + 1, r]));

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${reportTitle(analysis).replace(/[^\w\-]+/g, "_")}.xlsx"`
  );
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  await wb.xlsx.write(res);
  res.end();
});

export default router;
