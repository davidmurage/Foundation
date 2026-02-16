// Backend/services/reports/studentReport.builder.js
import User from "../../models/User.js";
import StudentProfile from "../../models/StudentProfile.js";
import StudentDocument from "../../models/StudentDocument.js";
import Performance from "../../models/Performance.js";
import FeeApplication from "../../models/FeesApplication.js";

/** Generate expected academic periods based on institution type + year */
function expectedPeriods(institutionType, currentYear) {
  const list = [];

  const isTVET = ["tvet", "college"].some((s) =>
    (institutionType || "").toLowerCase().includes(s)
  );

  const maxYear = Math.min(Math.max(parseInt(currentYear || "1", 10), 1), 5);

  for (let y = 1; y <= maxYear; y++) {
    const yearStr = String(y);

    if (!isTVET) {
      list.push({ yearOfStudy: yearStr, academicPeriod: "Sem 1" });
      list.push({ yearOfStudy: yearStr, academicPeriod: "Sem 2" });
      list.push({ yearOfStudy: yearStr, academicPeriod: "Sem 3" });

      // optional combined slots
      list.push({ yearOfStudy: yearStr, academicPeriod: "Semester 1&2" });
      list.push({ yearOfStudy: yearStr, academicPeriod: "Semester 1&2&3" });

      // attachment slot
      list.push({ yearOfStudy: yearStr, academicPeriod: "Attachment" });
    } else {
      list.push({ yearOfStudy: yearStr, academicPeriod: "Term 1" });
      list.push({ yearOfStudy: yearStr, academicPeriod: "Term 2" });
      list.push({ yearOfStudy: yearStr, academicPeriod: "Term 3" });
    }
  }

  return list;
}

/** Basic academic analysis */
function analyzeAcademic(expectedSlots, performanceRecords = []) {
  const perfMap = new Map(
    performanceRecords.map((p) => [`${p.yearOfStudy}-${p.academicPeriod}`, p])
  );

  const rows = expectedSlots.map((slot) => {
    const key = `${slot.yearOfStudy}-${slot.academicPeriod}`;
    const found = perfMap.get(key);

    return {
      yearOfStudy: slot.yearOfStudy,
      academicPeriod: slot.academicPeriod,
      gpa: found?.gpa ?? null,
      meanGrade: found?.meanGrade ?? null,
      rawAverage: found?.rawAverage ?? null,
      status: found?.gpa != null ? "complete" : "pending",
      updatedAt: found?.updatedAt ?? null,
    };
  });

  const completed = rows.filter((r) => r.gpa != null);
  const cumulativeGpa =
    completed.length > 0
      ? Number(
          (completed.reduce((acc, r) => acc + Number(r.gpa || 0), 0) /
            completed.length).toFixed(2)
        )
      : null;

  // Trend: compare first half avg vs second half avg (simple)
  let trend = "stable";
  if (completed.length >= 4) {
    const mid = Math.floor(completed.length / 2);
    const a = completed.slice(0, mid);
    const b = completed.slice(mid);

    const avgA =
      a.reduce((acc, r) => acc + Number(r.gpa || 0), 0) / (a.length || 1);
    const avgB =
      b.reduce((acc, r) => acc + Number(r.gpa || 0), 0) / (b.length || 1);

    if (avgB > avgA + 0.1) trend = "improving";
    else if (avgB < avgA - 0.1) trend = "declining";
  }

  return { records: rows, cumulativeGpa, trend };
}

/** Document compliance analysis */
function analyzeDocuments(docs = []) {
  const uploadedTypes = [...new Set(docs.map((d) => d.documentType).filter(Boolean))];

  // customize your required docs here
  const required = ["Fee Structure", "Fee Statement", "Transcript", "Department Letter"];

  const missing = required.filter((x) => !uploadedTypes.includes(x));
  const completionRate =
    required.length === 0
      ? 1
      : Number((((required.length - missing.length) / required.length) * 100).toFixed(0));

  return { uploaded: uploadedTypes, missing, completionRate };
}

/** Financial analysis from fee applications */
function analyzeFinance(apps = []) {
  const toNum = (v) => (v == null ? 0 : Number(v) || 0);

  const totalRequested = apps.reduce((acc, a) => acc + toNum(a.amountRequested), 0);
  const totalApproved = apps.reduce((acc, a) => acc + toNum(a.amountApproved), 0);

  // some systems store paid amount; if not, mark as approved when paid
  const totalPaid = apps.reduce((acc, a) => {
    if (String(a.processingStatus || "").toLowerCase() === "paid") {
      return acc + toNum(a.amountApproved || a.amountRequested);
    }
    return acc;
  }, 0);

  const outstanding = Math.max(totalApproved - totalPaid, 0);

  return {
    totalRequested,
    totalApproved,
    totalPaid,
    outstanding,
    applications: apps.map((a) => ({
      academicYear: a.academicYear || a.year || "-",
      amountRequested: toNum(a.amountRequested),
      amountApproved: toNum(a.amountApproved),
      reviewStatus: a.reviewStatus || "-",
      processingStatus: a.processingStatus || "-",
      createdAt: a.createdAt || null,
    })),
  };
}

/** Risk flags + recommendations */
function buildInsights(academicData, financialData, documentStatus) {
  const academicRisk =
    academicData.cumulativeGpa != null && academicData.cumulativeGpa < 2.5;

  const financialRisk = financialData.outstanding > 0;

  const notes = [];
  if (academicRisk) notes.push("Academic risk detected: cumulative GPA is below 2.5.");
  if (academicData.trend === "declining") notes.push("Academic trend is declining.");
  if (financialRisk) notes.push("Outstanding amount exists: follow up with disbursement status.");
  if (documentStatus.missing.length)
    notes.push(`Missing documents: ${documentStatus.missing.join(", ")}.`);

  if (!notes.length) notes.push("No major risk flags detected.");

  return { academicRisk, financialRisk, notes };
}

/**
 * Builds a full report payload for a student
 */
export async function buildStudentReportPayload(userId) {
  const [user, profile, documents, performance, fees] = await Promise.all([
    User.findById(userId).select("_id fullName email").lean(),
    StudentProfile.findOne({ userId }).lean(),
    StudentDocument.find({ userId }).sort({ createdAt: -1 }).lean(),
    Performance.find({ userId }).lean(),
    FeeApplication.find({ userId }).sort({ createdAt: -1 }).lean(),
  ]);

  if (!user) throw new Error("Student user not found");
  if (!profile) throw new Error("Student profile not found");

  const expectedSlots = expectedPeriods(profile.institutionType, profile.year);

  const academicData = analyzeAcademic(expectedSlots, performance);
  const documentStatus = analyzeDocuments(documents);
  const financialData = analyzeFinance(fees);
  const performanceInsights = buildInsights(academicData, financialData, documentStatus);

  const payload = {
    metadata: {
      reportId: `REP-${Date.now()}-${String(userId).slice(-6)}`,
      reportType: "Student Academic & Financial Report",
      generatedAt: new Date(),
      filters: { userId },
    },
    studentInfo: {
      userId: String(user._id),
      fullName: user.fullName || "",
      email: user.email || "",
      admissionNo: profile.admissionNo || profile.registrationNo || "",
      institutionName: profile.institutionName || profile.institution || "",
      institutionType: profile.institutionType || "",
      course: profile.course || "",
      yearOfStudy: Number(profile.year || 1),
    },
    academicData,
    documentStatus,
    financialData,
    performanceInsights,
  };

  return payload;
}
