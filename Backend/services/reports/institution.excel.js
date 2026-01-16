import ExcelJS from "exceljs";

export async function generateInstitutionExcel(report) {
  const wb = new ExcelJS.Workbook();

  const sh = wb.addWorksheet("Summary");
  sh.addRow(["Institution Type", report.metadata.institutionType]);
  sh.addRow(["Total Students", report.studentStats.totalStudents]);
  sh.addRow(["Overall GPA", report.overallGpa]);

  const acad = wb.addWorksheet("Academic");
  acad.addRow(["Year", "Average GPA", "Students"]);
  report.academicSummary.forEach(r =>
    acad.addRow([r.year, r.avgGpa, r.students])
  );

  const fin = wb.addWorksheet("Financials");
  fin.addRow(["Total Requested", report.financialSummary.totalRequested]);
  fin.addRow(["Total Approved", report.financialSummary.totalApproved]);
  fin.addRow(["Outstanding", report.financialSummary.outstanding]);

  return Buffer.from(await wb.xlsx.writeBuffer());
}
