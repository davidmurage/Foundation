import StudentProfile from "../../models/StudentProfile.js";
import StudentDocument from "../../models/StudentDocument.js";
import Performance from "../../models/Performance.js";
import FeeApplication from "../../models/FeesApplication.js";

/* ===============================
   MAIN INSTITUTION REPORT BUILDER
================================ */
export async function buildInstitutionReport(institutionId, institutionType) {
  /* STUDENTS */
  const profiles = await StudentProfile.find({
    institutionId,
    institutionType,
  }).lean();

  const userIds = profiles.map(p => p.userId);

  /* PERFORMANCE */
  const performance = await Performance.find({
    userId: { $in: userIds },
    gpa: { $ne: null },
  }).lean();

  /* DOCUMENTS */
  const documents = await StudentDocument.find({
    userId: { $in: userIds },
  }).lean();

  /* FEES */
  const fees = await FeeApplication.find({
    userId: { $in: userIds },
  }).lean();

  /* ===============================
     ACADEMIC ANALYSIS
  ================================ */
  const gpaByYear = {};
  performance.forEach(p => {
    const y = p.yearOfStudy;
    if (!gpaByYear[y]) gpaByYear[y] = [];
    gpaByYear[y].push(p.gpa);
  });

  const academicSummary = Object.entries(gpaByYear).map(([year, gpas]) => ({
    year,
    avgGpa: +(gpas.reduce((a, b) => a + b, 0) / gpas.length).toFixed(2),
    students: gpas.length,
  }));

  const overallGpa =
    performance.length > 0
      ? +(performance.reduce((a, b) => a + b.gpa, 0) / performance.length).toFixed(2)
      : null;

  /* ===============================
     DOCUMENT COMPLIANCE
  ================================ */
  const REQUIRED_DOCS = ["Transcript", "Fee Statement", "Fee Structure"];

  const docsByStudent = {};
  documents.forEach(d => {
    if (!docsByStudent[d.userId]) docsByStudent[d.userId] = new Set();
    docsByStudent[d.userId].add(d.documentType);
  });

  let compliant = 0;
  profiles.forEach(p => {
    const uploaded = docsByStudent[p.userId] || new Set();
    const ok = REQUIRED_DOCS.every(r => uploaded.has(r));
    if (ok) compliant++;
  });

  const documentCompliance = {
    totalStudents: profiles.length,
    compliantStudents: compliant,
    complianceRate: profiles.length
      ? Math.round((compliant / profiles.length) * 100)
      : 0,
  };

  /* ===============================
     FINANCIAL ANALYSIS
  ================================ */
  const sum = (arr, k) => arr.reduce((a, b) => a + (Number(b[k]) || 0), 0);

  const financialSummary = {
    totalRequested: sum(fees, "amountRequested"),
    totalApproved: sum(fees, "amountApproved"),
    totalPaid: fees.filter(f => f.processingStatus === "paid")
                   .reduce((a, b) => a + (Number(b.amountApproved) || 0), 0),
  };

  financialSummary.outstanding =
    financialSummary.totalApproved - financialSummary.totalPaid;

  /* ===============================
     INSIGHTS
  ================================ */
  const insights = [];

  if (overallGpa && overallGpa < 2.5)
    insights.push("Overall academic performance is below acceptable threshold.");

  if (documentCompliance.complianceRate < 70)
    insights.push("Low document compliance rate detected.");

  if (financialSummary.outstanding > 0)
    insights.push("Outstanding fee balances require follow-up.");

  if (!insights.length)
    insights.push("Institution performance is stable with no critical risks.");

  return {
    metadata: {
      institutionId,
      institutionType,
      generatedAt: new Date(),
    },
    studentStats: {
      totalStudents: profiles.length,
    },
    academicSummary,
    overallGpa,
    documentCompliance,
    financialSummary,
    insights,
  };
}
