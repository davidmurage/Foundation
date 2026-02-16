import express from "express";
import auth, { requireRole } from "../middleware/auth.js";
import Performance from "../models/Performance.js";
import StudentProfile from "../models/StudentProfile.js";

const router = express.Router();

/**
 * Generate expected periods based on institution type + year
 */
function generateExpected(institutionName = "", year = "1") {
  const periods = [];
  const lower = institutionName.toLowerCase();

  // Same logic as admin side
  const isTVET = ["tvet", "college"].some(keyword =>
    lower.includes(keyword)
  );

  const maxYear = Math.min(Math.max(parseInt(year, 10), 1), 5);

  for (let y = 1; y <= maxYear; y++) {
    if (!isTVET) {
      periods.push({ yearOfStudy: String(y), academicPeriod: "Semester 1" });
      periods.push({ yearOfStudy: String(y), academicPeriod: "Semester 2" });
      // NEW: combined year transcripts
      periods.push({ yearOfStudy: String(y), academicPeriod: "Semester 1&2" });
      periods.push({ yearOfStudy: String(y), academicPeriod: "Semester 1&2&3" });

      // NEW: attachment transcript slot
      periods.push({ yearOfStudy: String(y), academicPeriod: "Attachment" });
    } else {
      periods.push({ yearOfStudy: String(y), academicPeriod: "Term 1" });
      periods.push({ yearOfStudy: String(y), academicPeriod: "Term 2" });
      periods.push({ yearOfStudy: String(y), academicPeriod: "Term 3" });
    }
  }

  return periods;
}

/**
 * GET /api/performance
 */
router.get("/", auth, requireRole("student"), async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user.id });

    if (!profile) return res.json({ periods: [], years: [] });

    const institutionType = profile.institution?.toLowerCase().includes("tvet")
      ? "TVET"
      : "University";

    const currentYear = parseInt(profile.year || "1", 10);

    // Generate expected semester/term slots
    const expected = generateExpected(institutionType, currentYear);

    // All saved performance rows
    const perfRows = await Performance.find({ userId: req.user.id }).lean();

    // Map for quick lookups
    const perfMap = new Map(
      perfRows.map((p) => [`${p.yearOfStudy}-${p.academicPeriod}`, p])
    );

    /* ---------------------------------------------------
       1) BUILD PERIOD-LEVEL PERFORMANCE (Semester/Term)
    ----------------------------------------------------*/
    const periodList = expected.map((slot) => {
      const key = `${slot.yearOfStudy}-${slot.academicPeriod}`;
      return (
        perfMap.get(key) || {
          yearOfStudy: slot.yearOfStudy,
          academicPeriod: slot.academicPeriod,
          gpa: null,
          rawAverage: null,
          meanGrade: null,
          status: "pending",
        }
      );
    });

    /* ---------------------------------------------------
       2) BUILD YEARLY GPA TREND
         (combine all periods in a year)
    ----------------------------------------------------*/
    const yearBuckets = {};

    periodList.forEach((p) => {
      if (typeof p.gpa === "number") {
        const y = p.yearOfStudy;
        if (!yearBuckets[y]) {
          yearBuckets[y] = { sum: 0, count: 0 };
        }
        yearBuckets[y].sum += p.gpa;
        yearBuckets[y].count += 1;
      }
    });

    const years = Object.keys(yearBuckets)
      .sort((a, b) => Number(a) - Number(b))
      .map((y) => ({
        yearOfStudy: y,
        averageGpa: +(yearBuckets[y].sum / yearBuckets[y].count).toFixed(2),
      }));

    /* ---------------------------------------------------
       3) RETURN BOTH DATASETS
       - periods → for semester/term performance chart
       - years   → for year 1 → year 2 → year 3 trend
    ----------------------------------------------------*/

    res.json({
      periods: periodList,
      years,
    });
  } catch (err) {
    console.error("PERFORMANCE ROUTE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});


/**
 * Convert mean grade to GPA (same scale as transcriptParser)
 */
const gradeToGpa = { A: 5, B: 4, C: 3, D: 2, E: 1 };

/**
 * GET yearly performance trend
 */
router.get("/yearly", auth, requireRole("student"), async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user.id });
    if (!profile) return res.json([]);

    const perf = await Performance.find({ userId: req.user.id }).lean();

    // group by year
    const yearMap = {};
    for (const p of perf) {
      const year = p.yearOfStudy;
      if (!yearMap[year]) yearMap[year] = [];

      const gpa =
        typeof p.gpa === "number"
          ? p.gpa
          : p.meanGrade
          ? gradeToGpa[p.meanGrade]
          : null;

      if (gpa !== null) yearMap[year].push(gpa);
    }

    const yearly = Object.keys(yearMap).map((year) => {
      const arr = yearMap[year];
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length;

      return {
        year,
        semesters: arr.length,
        avgGpa: +avg.toFixed(2),
      };
    });

    yearly.sort((a, b) => Number(a.year) - Number(b.year));

    // calculate trend
    const trend = yearly.map((y, i) => {
      if (i === 0) return { ...y, change: null, direction: "same" };

      const prev = yearly[i - 1].avgGpa;
      const diff = +(y.avgGpa - prev).toFixed(2);

      return {
        ...y,
        change: diff,
        direction: diff > 0 ? "up" : diff < 0 ? "down" : "same",
      };
    });

    res.json(trend);
  } catch (err) {
    console.error("YEARLY PERFORMANCE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
