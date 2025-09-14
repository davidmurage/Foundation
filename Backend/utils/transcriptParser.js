import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import Tesseract from "tesseract.js";

export async function toPlainText(
  buffer,
  { mimetype = "", originalname = "" } = {}
) {
  const ext = (originalname?.split(".").pop() || "").toLowerCase();

  // --- PDF Handling ---
  if (mimetype === "application/pdf" || ext === "pdf") {
    try {
      if (!buffer) {
        console.error("No buffer received for PDF");
        return "";
      }

      if (!Buffer.isBuffer(buffer)) {
        console.warn("Buffer is not a real Buffer. Converting...");
        buffer = Buffer.from(buffer);
      }

      console.log("Parsing PDF. Buffer length:", buffer.length);

      const { text } = await pdfParse(buffer);
      return text || "";
    } catch (err) {
      console.error("PDF parse failed:", err.message);
      return "";
    }
  }

  // --- DOCX Handling ---
  const isDocx =
    mimetype.includes("officedocument.wordprocessingml") || ext === "docx";
  if (isDocx) {
    try {
      const { value } = await mammoth.extractRawText({ buffer });
      return value || "";
    } catch (err) {
      console.error("DOCX parse failed:", err.message);
      return "";
    }
  }

  // --- DOC Handling ---
  if (mimetype === "application/msword" || ext === "doc") {
    try {
      const { value } = await mammoth.extractRawText({ buffer });
      return value || "";
    } catch (err) {
      console.error("DOC parse failed:", err.message);
      return "";
    }
  }

  // --- IMAGE Handling (OCR) ---
  if (mimetype.startsWith("image/") || ["jpg", "jpeg", "png"].includes(ext)) {
    try {
      const { data } = await Tesseract.recognize(buffer, "eng");
      return data?.text || "";
    } catch (err) {
      console.error("OCR parse failed:", err.message);
      return "";
    }
  }

  // --- Fallback: UTF-8 ---
  return buffer.toString("utf8");
}

// Extract GPA/Average/Grade
export function extractGpa(text) {
  if (!text) return { gpa: null, rawAverage: null, meanGrade: null };

  // Match "AVERAGE: 53.50"
  const avgMatch = text.match(/AVERAGE[:\s]*([0-9]+(\.[0-9]+)?)/i);
  if (avgMatch) {
    const rawAverage = parseFloat(avgMatch[1]);
    const gpa = +(rawAverage / 20).toFixed(2); // scale 0–100 → 0–5
    return { gpa: Math.min(gpa, 5), rawAverage, meanGrade: null };
  }

  // Match "MEAN GRADE: C"
  const gradeMatch = text.match(/MEAN\s*GRADE[:\s]*([A-E])/i);
  if (gradeMatch) {
    const meanGrade = gradeMatch[1].toUpperCase();
    const gradeToGpa = { A: 5, B: 4, C: 3, D: 2, E: 1 };
    return {
      gpa: gradeToGpa[meanGrade] || null,
      rawAverage: null,
      meanGrade,
    };
  }

  // Match "GPA: X"
  const gpaMatch = text.match(/\bGPA[:\s]*([0-9]+(\.[0-9]+)?)/i);
  if (gpaMatch) {
    return {
      gpa: parseFloat(gpaMatch[1]),
      rawAverage: null,
      meanGrade: null,
    };
  }

  return { gpa: null, rawAverage: null, meanGrade: null };
}
