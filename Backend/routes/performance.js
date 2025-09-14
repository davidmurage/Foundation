
import express from "express";
import auth, { requireRole } from "../middleware/auth.js";
import Performance from "../models/Performance.js";
import StudentProfile from "../models/StudentProfile.js";

const router = express.Router();

function generateExpected(institutionType, year) {
  const periods = [];
  const maxYear = Math.min(Math.max(parseInt(year || "1", 10), 1), 5);

  for (let y = 1; y <= maxYear; y++) {
    if (institutionType === "University") {
      periods.push({ yearOfStudy: String(y), academicPeriod: "Semester 1" });
      periods.push({ yearOfStudy: String(y), academicPeriod: "Semester 2" });
    } else {
      periods.push({ yearOfStudy: String(y), academicPeriod: "Term 1" });
      periods.push({ yearOfStudy: String(y), academicPeriod: "Term 2" });
      periods.push({ yearOfStudy: String(y), academicPeriod: "Term 3" });
    }
  }
  return periods;
}

router.get("/", auth, requireRole("student"), async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user.id });
    const type = profile?.institution?.toLowerCase().includes("tvet") ? "TVET" : "University";
    const currentYear = profile?.year || "1";

    const expected = generateExpected(type, currentYear);
    const perf = await Performance.find({ userId: req.user.id });

    const map = new Map();
    perf.forEach((p) => map.set(`${p.yearOfStudy}-${p.academicPeriod}`, p));

    const result = expected.map((e) => {
      const found = map.get(`${e.yearOfStudy}-${e.academicPeriod}`);
      return (
        found || {
          yearOfStudy: e.yearOfStudy,
          academicPeriod: e.academicPeriod,
          gpa: null,
          rawAverage: null,
          meanGrade: null,
          status: "pending",
        }
      );
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
