import pdfParse from "pdf-parse";
import mammoth from "mammoth";

/* ---------------------------------------------
   Convert uploaded file buffer → plain text
----------------------------------------------*/
export async function toPlainText(buffer, file) {
  const { mimetype, originalname } = file;

  // PDF
  if (mimetype === "application/pdf") {
    const data = await pdfParse(buffer);
    return data.text;
  }

  // DOCX
  if (
    mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    originalname.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // Plain text fallback
  if (mimetype === "text/plain") {
    return buffer.toString("utf-8");
  }

  throw new Error("Unsupported transcript format");
}

/* ---------------------------------------------
   GPA / Mean extraction (unchanged)
----------------------------------------------*/
export function extractGpa(text) {
  let gpa = null;
  let rawAverage = null;
  let meanGrade = null;

  const gpaMatch = text.match(/GPA\s*[:\-]?\s*([0-9.]+)/i);
  if (gpaMatch) gpa = parseFloat(gpaMatch[1]);

  const avgMatch = text.match(/Average\s*[:\-]?\s*([0-9.]+)/i);
  if (avgMatch) rawAverage = parseFloat(avgMatch[1]);

  const gradeMatch = text.match(/Mean\s*Grade\s*[:\-]?\s*([A-Z]+)/i);
  if (gradeMatch) meanGrade = gradeMatch[1];

  return { gpa, rawAverage, meanGrade };
}
