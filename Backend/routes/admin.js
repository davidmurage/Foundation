import express from "express";
import auth, { requireRole } from "../middleware/auth.js";
import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import StudentDocument from "../models/StudentDocument.js";
import Performance from "../models/Performance.js";

const router = express.Router();

/** helper: expected periods (same as student side) */
function expectedPeriods(institutionType, currentYear) {
  const list = [];
  const isTVET = ["tvet", "college"].some(s =>
    (institutionType || "").toLowerCase().includes(s)
  );
  const maxYear = Math.min(Math.max(parseInt(currentYear || "1", 10), 1), 5);
  for (let y = 1; y <= maxYear; y++) {
    if (!isTVET) {
      list.push({ yearOfStudy: String(y), academicPeriod: "Semester 1" });
      list.push({ yearOfStudy: String(y), academicPeriod: "Semester 2" });
    } else {
      list.push({ yearOfStudy: String(y), academicPeriod: "Term 1" });
      list.push({ yearOfStudy: String(y), academicPeriod: "Term 2" });
      list.push({ yearOfStudy: String(y), academicPeriod: "Term 3" });
    }
  }
  return list;
}

/**
 * GET /api/admin/students
 * Query params: institutionType (University|TVET), year (1..5), search (name/email/admission)
 * Returns: compact list for table
 */
router.get("/students", auth, requireRole("admin"), async (req, res) => {
  try {
    const { institutionType = "", year = "", search = "" } = req.query;

    const profileFilter = {};
    if (year) profileFilter.year = year;
    if (institutionType) profileFilter.institution = new RegExp(institutionType, "i"); // match "University" or "TVET/College"

    // We fetch profiles, then join to users
    const profiles = await StudentProfile.find(profileFilter).lean();

    // Optional in-memory search across name/email/admission
    const userIds = profiles.map(p => p.userId);
    const users = await User.find({ _id: { $in: userIds } })
      .select("_id fullName email role")
      .lean();

    const userMap = new Map(users.map(u => [String(u._id), u]));
    let rows = profiles.map(p => ({
      userId: String(p.userId),
      fullName: userMap.get(String(p.userId))?.fullName || "",
      email: userMap.get(String(p.userId))?.email || "",
      admissionNo: p.admissionNo,
      institution: p.institution,
      course: p.course,
      year: p.year,
      photo: p.photo || null,
    }));

    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        (r.fullName || "").toLowerCase().includes(q) ||
        (r.email || "").toLowerCase().includes(q) ||
        (r.admissionNo || "").toLowerCase().includes(q)
      );
    }

    // Grouping/sorting can be handled client-side; return rows
    res.json(rows);
  } catch (err) {
    console.error("ADMIN students error:", err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/admin/student/:userId
 * Returns: profile, documents, performance (completed + pending slots)
 */
router.get("/student/:userId", auth, requireRole("admin"), async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("_id fullName email").lean();
    const profile = await StudentProfile.findOne({ userId }).lean();
    const documents = await StudentDocument.find({ userId }).sort({ createdAt: -1 }).lean();
    const perf = await Performance.find({ userId }).lean();

    const expected = expectedPeriods(profile?.institution, profile?.year);
    const perfMap = new Map(
      (perf || []).map(p => [`${p.yearOfStudy}-${p.academicPeriod}`, p])
    );

    const performance = expected.map(slot => {
      const key = `${slot.yearOfStudy}-${slot.academicPeriod}`;
      return (
        perfMap.get(key) || {
          yearOfStudy: slot.yearOfStudy,
          academicPeriod: slot.academicPeriod,
          gpa: null,
          rawAverage: null,
          meanGrade: null,
          status: "pending",
          updatedAt: null,
        }
      );
    });

    res.json({
      user,
      profile,
      documents,
      performance,
    });
  } catch (err) {
    console.error("ADMIN student detail error:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
