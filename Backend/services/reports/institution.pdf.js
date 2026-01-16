import puppeteer from "puppeteer";

export async function generateInstitutionPDF(report) {
  const html = `
  <html>
  <head>
    <style>
      body { font-family: Arial; padding: 30px; }
      h1 { border-bottom: 2px solid #333; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th, td { border: 1px solid #ccc; padding: 8px; }
      th { background: #f2f2f2; }
    </style>
  </head>
  <body>
    <h1>${report.metadata.institutionType} Institutional Report</h1>

    <h2>Academic Summary</h2>
    <p><b>Overall GPA:</b> ${report.overallGpa ?? "N/A"}</p>

    <table>
      <tr><th>Year</th><th>Average GPA</th><th>Students</th></tr>
      ${report.academicSummary.map(y =>
        `<tr><td>${y.year}</td><td>${y.avgGpa}</td><td>${y.students}</td></tr>`
      ).join("")}
    </table>

    <h2>Document Compliance</h2>
    <p>${report.documentCompliance.complianceRate}% students compliant</p>

    <h2>Financial Summary</h2>
    <p>Total Requested: ${report.financialSummary.totalRequested}</p>
    <p>Total Approved: ${report.financialSummary.totalApproved}</p>
    <p>Outstanding: ${report.financialSummary.outstanding}</p>

    <h2>Insights & Recommendations</h2>
    <ul>
      ${report.insights.map(i => `<li>${i}</li>`).join("")}
    </ul>

  </body>
  </html>
  `;

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html);
  const pdf = await page.pdf({ format: "A4" });
  await browser.close();
  return pdf;
}
