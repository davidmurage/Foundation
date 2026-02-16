// Backend/services/reports/pdf.exporter.js
import puppeteer from "puppeteer";

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function money(n) {
  const v = Number(n || 0);
  return v.toLocaleString("en-KE", { maximumFractionDigits: 0 });
}

function buildHtml(payload) {
  const s = payload.studentInfo;
  const a = payload.academicData;
  const d = payload.documentStatus;
  const f = payload.financialData;
  const i = payload.performanceInsights;

  const academicRows = a.records
    .map(
      (r) => `
      <tr>
        <td>${esc(r.yearOfStudy)}</td>
        <td>${esc(r.academicPeriod)}</td>
        <td>${r.gpa == null ? "-" : esc(r.gpa)}</td>
        <td>${esc(r.status)}</td>
      </tr>
    `
    )
    .join("");

  const missingRows = d.missing
    .map((x) => `<li>${esc(x)}</li>`)
    .join("");

  const uploadedRows = d.uploaded
    .map((x) => `<li>${esc(x)}</li>`)
    .join("");

  const feeRows = (f.applications || [])
    .slice(0, 12)
    .map(
      (x) => `
    <tr>
      <td>${esc(x.academicYear)}</td>
      <td>${money(x.amountRequested)}</td>
      <td>${money(x.amountApproved)}</td>
      <td>${esc(x.reviewStatus)}</td>
      <td>${esc(x.processingStatus)}</td>
    </tr>`
    )
    .join("");

  return `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: Arial, sans-serif; color: #111; margin: 28px; }
      .top { display:flex; justify-content:space-between; align-items:flex-start; }
      .brand { font-weight:700; font-size:18px; }
      .muted { color:#555; font-size:12px; }
      h1 { font-size:18px; margin: 12px 0 4px; }
      h2 { font-size:14px; margin: 18px 0 8px; }
      .box { border:1px solid #ddd; padding:12px; border-radius:10px; margin-top:10px; }
      .grid { display:grid; grid-template-columns: 1fr 1fr; gap:10px; }
      table { width:100%; border-collapse:collapse; font-size:12px; }
      th, td { border:1px solid #ddd; padding:8px; text-align:left; }
      th { background:#f3f3f3; }
      .pill { display:inline-block; padding:4px 10px; border-radius:999px; font-size:12px; border:1px solid #ddd; }
      .ok { background:#eefaf0; }
      .warn { background:#fff6e6; }
      .bad { background:#ffecec; }
      .footer { margin-top:18px; font-size:11px; color:#666; }
      ul { margin: 6px 0 0 16px; }
    </style>
  </head>
  <body>

    <div class="top">
      <div>
        <div class="brand">KCB Student Portal — Report</div>
        <div class="muted">${esc(payload.metadata.reportType)}</div>
      </div>
      <div class="muted">
        Report ID: <b>${esc(payload.metadata.reportId)}</b><br/>
        Generated: <b>${new Date(payload.metadata.generatedAt).toLocaleString()}</b>
      </div>
    </div>

    <div class="box">
      <h1>Student Summary</h1>
      <div class="grid">
        <div>
          <div><b>Name:</b> ${esc(s.fullName)}</div>
          <div><b>Email:</b> ${esc(s.email)}</div>
          <div><b>Admission No:</b> ${esc(s.admissionNo)}</div>
        </div>
        <div>
          <div><b>Institution:</b> ${esc(s.institutionName)}</div>
          <div><b>Institution Type:</b> ${esc(s.institutionType)}</div>
          <div><b>Course:</b> ${esc(s.course)}</div>
          <div><b>Year of Study:</b> ${esc(s.yearOfStudy)}</div>
        </div>
      </div>
    </div>

    <div class="box">
      <h2>Academic Performance</h2>
      <div class="muted">
        Cumulative GPA: <b>${a.cumulativeGpa == null ? "-" : esc(a.cumulativeGpa)}</b>
        &nbsp;|&nbsp; Trend: <b>${esc(a.trend)}</b>
      </div>
      <table style="margin-top:10px;">
        <thead>
          <tr>
            <th>Year</th>
            <th>Period</th>
            <th>GPA</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${academicRows}
        </tbody>
      </table>
    </div>

    <div class="box">
      <h2>Document Compliance</h2>
      <div class="muted">Completion Rate: <b>${esc(d.completionRate)}%</b></div>
      <div class="grid" style="margin-top:10px;">
        <div>
          <div class="pill ok"><b>Uploaded</b></div>
          <ul>${uploadedRows || "<li>None</li>"}</ul>
        </div>
        <div>
          <div class="pill ${d.missing.length ? "warn" : "ok"}"><b>Missing</b></div>
          <ul>${missingRows || "<li>None</li>"}</ul>
        </div>
      </div>
    </div>

    <div class="box">
      <h2>Financial Summary (KES)</h2>
      <div class="grid">
        <div><b>Requested:</b> ${money(f.totalRequested)}</div>
        <div><b>Approved:</b> ${money(f.totalApproved)}</div>
        <div><b>Paid:</b> ${money(f.totalPaid)}</div>
        <div><b>Outstanding:</b> ${money(f.outstanding)}</div>
      </div>

      <h2 style="margin-top:14px;">Fee Applications (latest)</h2>
      <table>
        <thead>
          <tr>
            <th>Academic Year</th>
            <th>Requested</th>
            <th>Approved</th>
            <th>Review</th>
            <th>Processing</th>
          </tr>
        </thead>
        <tbody>
          ${feeRows || `<tr><td colspan="5">No fee applications</td></tr>`}
        </tbody>
      </table>
    </div>

    <div class="box">
      <h2>Insights & Risk Flags</h2>
      <div class="grid">
        <div>
          <div class="pill ${i.academicRisk ? "bad" : "ok"}">Academic Risk: <b>${i.academicRisk ? "YES" : "NO"}</b></div>
        </div>
        <div>
          <div class="pill ${i.financialRisk ? "warn" : "ok"}">Financial Risk: <b>${i.financialRisk ? "YES" : "NO"}</b></div>
        </div>
      </div>
      <ul style="margin-top:10px;">
        ${(i.notes || []).map((n) => `<li>${esc(n)}</li>`).join("")}
      </ul>
    </div>

    <div class="footer">
      This document is system-generated for reporting and auditing purposes.
    </div>

  </body>
  </html>
  `;
}

export async function exportStudentReportPdfBuffer(payload) {
  const html = buildHtml(payload);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "14mm", right: "12mm", bottom: "14mm", left: "12mm" },
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}
