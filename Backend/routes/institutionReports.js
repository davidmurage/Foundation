import express from "express";
import auth, { requireRole } from "../middleware/auth.js";
import { buildInstitutionReport } from "../services/reports/institutionReport.builder.js";
import { generateInstitutionPDF } from "../services/reports/institution.pdf.js";
import { generateInstitutionExcel } from "../services/reports/institution.excel.js";

const router = express.Router();

/* PDF */
router.get("/:institutionId/pdf", auth, requireRole("admin"), async (req, res) => {
  const report = await buildInstitutionReport(
    req.params.institutionId,
    req.query.type
  );

  const pdf = await generateInstitutionPDF(report);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=institution-report.pdf");
  res.send(pdf);
});

/* EXCEL */
router.get("/:institutionId/excel", auth, requireRole("admin"), async (req, res) => {
  const report = await buildInstitutionReport(
    req.params.institutionId,
    req.query.type
  );

  const excel = await generateInstitutionExcel(report);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=institution-report.xlsx");
  res.send(excel);
});

export default router;
