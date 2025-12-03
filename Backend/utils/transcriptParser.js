import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import Tesseract from "tesseract.js";

/**
 * Convert ANY uploaded transcript into plain text
 * Supports:
 *  - PDF (digital)
 *  - PDF (scanned image → OCR)
 *  - DOCX
 *  - DOC
 *  - JPG / PNG (OCR)
 */
export async function toPlainText(buffer, { mimetype = "", originalname = "" } = {}) {
  let ext = (originalname?.split(".").pop() || "").toLowerCase();

  // Ensure Buffer format
  if (!Buffer.isBuffer(buffer)) buffer = Buffer.from(buffer);

  /* 1) PDF HANDLING (Digital + Scanned fallback)*/
  if (mimetype === "application/pdf" || ext === "pdf") {
    try {
      console.log("[PDF] Starting PDF text extraction");

      const pdfResult = await pdfParse(buffer);
      let text = pdfResult?.text || "";

      // If PDF has NO text → MUST be a scanned PDF → Use OCR
      if (!text || text.trim().length < 20) {
        console.log("[PDF] No digital text found. Running OCR (scanned PDF).");

        const ocrResult = await Tesseract.recognize(buffer, "eng", {
          logger: (msg) => console.log("[OCR]", msg),
        });

        return ocrResult?.data?.text || "";
      }

      return text;
    } catch (err) {
      console.error("[PDF] Error parsing PDF:", err.message);
      return "";
    }
  }

  /*  2) DOCX HANDLING*/
  const isDocx =
    mimetype.includes("officedocument.wordprocessingml") || ext === "docx";

  if (isDocx) {
    try {
      console.log("[DOCX] Extracting text");
      const { value } = await mammoth.extractRawText({ buffer });
      return value || "";
    } catch (err) {
      console.error("[DOCX] Error extracting text:", err.message);
      return "";
    }
  }

  /* 3) DOC HANDLING*/
  if (mimetype === "application/msword" || ext === "doc") {
    try {
      console.log("[DOC] Extracting text");
      const { value } = await mammoth.extractRawText({ buffer });
      return value || "";
    } catch (err) {
      console.error("[DOC] Error extracting text:", err.message);
      return "";
    }
  }

  /* 4) IMAGE HANDLING (OCR)*/
  const isImg = mimetype.startsWith("image/") || ["jpg", "jpeg", "png"].includes(ext);

  if (isImg) {
    try {
      console.log("[OCR] Extracting text from image");

      const { data } = await Tesseract.recognize(buffer, "eng", {
        logger: (msg) => console.log("[OCR]", msg),
      });

      return data?.text || "";
    } catch (err) {
      console.error("[OCR] Image parse failed:", err.message);
      return "";
    }
  }

  /* 5) FALLBACK → plain UTF8 */
  return buffer.toString("utf8");
}

/**
 * Extract GPA, rawAverage, meanGrade from text
 * Supports:
 *  - "MEAN GRADE: A"
 *  - "MEAN GRADE : A"
 *  - "AVERAGE: 56.33"
 *  - "GPA: 3.78"
 *  - DKUT format (your sample)
 *  - USIU, KU, JKUAT, MMUST, Egerton formats
 */
export function extractGpa(text) {
  if (!text) return { gpa: null, rawAverage: null, meanGrade: null };

  // Normalize spacing
  const clean = text.replace(/\s+/g, " ").trim();

  // ================================================
  // 1. DKUT Mean Grade: "Mean Grade: A"
  // ================================================
  const dkutGradeMatch = clean.match(/MEAN\s*GRADE\s*[:\-]?\s*([A-E])/i);
  if (dkutGradeMatch) {
    const meanGrade = dkutGradeMatch[1].toUpperCase();
    const gradeToGpa = { A: 5, B: 4, C: 3, D: 2, E: 1 };

    return {
      gpa: gradeToGpa[meanGrade] || null,
      rawAverage: null,
      meanGrade
    };
  }

  // ================================================
  // 2. Check for Mean Score (other universities)
  // ================================================
  const meanScoreMatch = clean.match(/MEAN\s*SCORE\s*[:\-]?\s*([0-9]+(\.[0-9]+)?)/i);
  if (meanScoreMatch) {
    const rawAverage = parseFloat(meanScoreMatch[1]);
    const gpa = +(rawAverage / 20).toFixed(2);
    return { gpa: Math.min(gpa, 5), rawAverage, meanGrade: null };
  }

  // ================================================
  // 3. Check for AVERAGE: 53.50
  // ================================================
  const avgMatch = clean.match(/AVERAGE\s*[:\-]?\s*([0-9]+(\.[0-9]+)?)/i);
  if (avgMatch) {
    const rawAverage = parseFloat(avgMatch[1]);
    const gpa = +(rawAverage / 20).toFixed(2);
    return { gpa: Math.min(gpa, 5), rawAverage, meanGrade: null };
  }

  // ================================================
  // 4. Check for GPA: 3.45
  // ================================================
  const gpaMatch = clean.match(/\bGPA\s*[:\-]?\s*([0-9]+(\.[0-9]+)?)/i);
  if (gpaMatch) {
    return {
      gpa: parseFloat(gpaMatch[1]),
      rawAverage: null,
      meanGrade: null,
    };
  }

  // Nothing matched
  return { gpa: null, rawAverage: null, meanGrade: null };
}

