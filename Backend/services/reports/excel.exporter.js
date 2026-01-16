// Backend/services/reports/excel.exporter.js
import ExcelJS from "exceljs";

function money(n) {
  const v = Number(n || 0);
  return v;
}

export async function exportStudentReportExcelBuffer(payload) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "KCB Student Portal";

  const s = payload.studentInfo;
  const a = payload.academicData;
  const d = payload.documentStatus;
  const f = payload.financialData;
  const i = payload.performanceInsights;

  // Sheet 1: Summary
  const sh1 = wb.addWorksheet("Summary");
  sh1.addRow(["Report ID", payload.metadata.reportId]);
  sh1.addRow(["Generated At", new Date(payload.metadata.generatedAt).toLocaleString()]);
  sh1.addRow([]);
  sh1.addRow(["Full Name", s.fullName]);
  sh1.addRow(["Email", s.email]);
  sh1.addRow(["Admission No", s.admissionNo]);
  sh1.addRow(["Institution", s.institutionName]);
  sh1.addRow(["Institution Type", s.institutionType]);
  sh1.addRow(["Course", s.course]);
  sh1.addRow(["Year of Study", s.yearOfStudy]);
  sh1.addRow([]);
  sh1.addRow(["Cumulative GPA", a.cumulativeGpa ?? ""]);
  sh1.addRow(["Trend", a.trend]);
  sh1.addRow(["Document Completion Rate (%)", d.completionRate]);
  sh1.addRow(["Academic Risk", i.academicRisk ? "YES" : "NO"]);
  sh1.addRow(["Financial Risk", i.financialRisk ? "YES" : "NO"]);

  // Sheet 2: Academic
  const sh2 = wb.addWorksheet("Academic");
  sh2.addRow(["Year", "Period", "GPA", "Mean Grade", "Average", "Status"]);
  a.records.forEach((r) => {
    sh2.addRow([
      r.yearOfStudy,
      r.academicPeriod,
      r.gpa ?? "",
      r.meanGrade ?? "",
      r.rawAverage ?? "",
      r.status,
    ]);
  });
  sh2.getRow(1).font = { bold: true };

  // Sheet 3: Documents
  const sh3 = wb.addWorksheet("Documents");
  sh3.addRow(["Uploaded Types"]);
  d.uploaded.forEach((x) => sh3.addRow([x]));
  sh3.addRow([]);
  sh3.addRow(["Missing Types"]);
  d.missing.forEach((x) => sh3.addRow([x]));
  sh3.getRow(1).font = { bold: true };
  sh3.getRow(4).font = { bold: true };

  // Sheet 4: Fees
  const sh4 = wb.addWorksheet("Fees");
  sh4.addRow(["Academic Year", "Requested", "Approved", "Review", "Processing", "Created At"]);
  (f.applications || []).forEach((x) => {
    sh4.addRow([
      x.academicYear,
      money(x.amountRequested),
      money(x.amountApproved),
      x.reviewStatus,
      x.processingStatus,
      x.createdAt ? new Date(x.createdAt).toLocaleDateString() : "",
    ]);
  });
  sh4.getRow(1).font = { bold: true };

  // Totals
  sh4.addRow([]);
  sh4.addRow(["TOTALS", "", "", "", "", ""]);
  sh4.addRow(["Total Requested", money(f.totalRequested)]);
  sh4.addRow(["Total Approved", money(f.totalApproved)]);
  sh4.addRow(["Total Paid", money(f.totalPaid)]);
  sh4.addRow(["Outstanding", money(f.outstanding)]);

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
