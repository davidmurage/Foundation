import express from "express";
import auth, { requireRole } from "../middleware/auth.js";
import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import StudentDocument from "../models/StudentDocument.js";
import Performance from "../models/Performance.js";
import Institution from "../models/Institution.js";

const router = express.Router();

/** helper: expected periods (same as student side) */
function expectedPeriods(institutionType, currentYear) {
  const list = [];

  const isTVET = ["tvet", "college"].some((s) =>
    (institutionType || "").toLowerCase().includes(s)
  );

  const maxYear = Math.min(
    Math.max(parseInt(currentYear || "1", 10), 1),
    5
  );

  for (let y = 1; y <= maxYear; y++) {
    const yearStr = String(y);

    if (!isTVET) {
      // UNIVERSITY / DEGREE PROGRAMMES
      // keep single semesters
      list.push({ yearOfStudy: yearStr, academicPeriod: "Semester 1" });
      list.push({ yearOfStudy: yearStr, academicPeriod: "Semester 2" });
      list.push({ yearOfStudy: yearStr, academicPeriod: "Semester 3" });

      // NEW: combined year transcripts
      list.push({ yearOfStudy: yearStr, academicPeriod: "Semester 1&2" });
      list.push({ yearOfStudy: yearStr, academicPeriod: "Semester 1&2&3" });

      // NEW: attachment transcript slot
      list.push({ yearOfStudy: yearStr, academicPeriod: "Attachment" });
    } else {
      // TVET / COLLEGE – UNCHANGED
      list.push({ yearOfStudy: yearStr, academicPeriod: "Term 1" });
      list.push({ yearOfStudy: yearStr, academicPeriod: "Term 2" });
      list.push({ yearOfStudy: yearStr, academicPeriod: "Term 3" });
    }
  }

  return list;
}


// Helper: build filter object from query
function buildFilter(query) {
  const filter = {};
  if (query.type) filter.type = query.type;
  if (query.county) filter.county = query.county;
  if (query.active === "true") filter.isActive = true;
  if (query.active === "false") filter.isActive = false;

  if (query.search) {
    const regex = new RegExp(query.search, "i");
    filter.$or = [{ name: regex }, { county: regex }, { location: regex }];
  }

  return filter;
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

/*ADMIN OVERVIEW STATS*/
router.get("/stats", auth, requireRole("admin"), async (req, res) => {
  try {
    // Count all students
    const totalStudents = await User.countDocuments({ role: "student" });

    // Students with profile completed
    const profiledStudents = await StudentProfile.countDocuments();

    // All uploaded documents
    const totalDocuments = await StudentDocument.countDocuments();

    // Count transcripts only
    const totalTranscripts = await StudentDocument.countDocuments({
      documentType: "Transcript",
    });

    // Average GPA across all performance records
    const gpaAgg = await Performance.aggregate([
      { $match: { gpa: { $ne: null } } },
      { $group: { _id: null, avgGpa: { $avg: "$gpa" } } },
    ]);
    const avgGpa =
      gpaAgg.length > 0 ? Number(gpaAgg[0].avgGpa).toFixed(2) : null;

    // Students per institution (based on profiles)
    const studentsByInstitution = await StudentProfile.aggregate([
      {
        $group: {
          _id: "$institutionType",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Documents by type (fee structure, transcript, etc.)
    const docsByType = await StudentDocument.aggregate([
      {
        $group: {
          _id: "$documentType",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Average GPA by year of study
    const gpaByYear = await Performance.aggregate([
      { $match: { gpa: { $ne: null } } },
      {
        $group: {
          _id: "$yearOfStudy",
          avgGpa: { $avg: "$gpa" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      totalStudents,
      profiledStudents,
      totalDocuments,
      totalTranscripts,
      avgGpa,
      studentsByInstitution,
      docsByType,
      gpaByYear,
    });
  } catch (err) {
    console.error("ADMIN STATS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/*LATEST DOCUMENTS (for dashboard)*/
router.get(
  "/latest-documents",
  auth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const docs = await StudentDocument.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("userId", "fullName email");

      res.json(docs);
    } catch (err) {
      console.error("LATEST DOCS ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/*
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

/* ============================
   GET ALL ADMIN USERS
============================= */
router.get("/", auth, requireRole("admin"), async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" }).select("-password");
    res.json(admins);
  } catch (err) {
    console.error("GET ADMIN USERS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ============================
   CREATE NEW ADMIN USER
============================= */
router.post("/", auth, requireRole("admin"), async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "Email already exists" });

    const newAdmin = await User.create({
      fullName,
      email,
      password,
      role: "admin",
    });

    res.json({
      message: "Admin created successfully",
      admin: {
        id: newAdmin._id,
        fullName: newAdmin.fullName,
        email: newAdmin.email,
      },
    });
  } catch (err) {
    console.error("CREATE ADMIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ============================
   UPDATE AN ADMIN USER
============================= */
router.put("/:id", auth, requireRole("admin"), async (req, res) => {
  try {
    const { fullName, email } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { fullName, email },
      { new: true }
    ).select("-password");

    res.json({ message: "Admin updated", admin: updated });
  } catch (err) {
    console.error("UPDATE ADMIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ============================
   DELETE ADMIN USER
============================= */
router.delete("/:id", auth, requireRole("admin"), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Admin deleted" });
  } catch (err) {
    console.error("DELETE ADMIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});



/**
 * GET /api/admin/institutions
 * List institutions with filters + search
 */
router.get(
  "/",
  auth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const filter = buildFilter(req.query);
      const institutions = await Institution.find(filter)
        .sort({ createdAt: -1 })
        .lean();

      res.json(institutions);
    } catch (err) {
      console.error("INSTITUTIONS LIST ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * POST /api/admin/institutions
 * Create institution
 */
router.post(
  "/",
  auth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { name, type, county, location, code, logoUrl, description, isActive } = req.body;

      if (!name || !type) {
        return res.status(400).json({ message: "Name and type are required" });
      }

      const exists = await Institution.findOne({ name: name.trim() });
      if (exists) {
        return res
          .status(400)
          .json({ message: "Institution with this name already exists" });
      }

      const inst = await Institution.create({
        name: name.trim(),
        type,
        county,
        location,
        code,
        logoUrl,
        description,
        isActive: isActive !== undefined ? isActive : true,
        createdBy: req.user.id,
      });

      res.status(201).json(inst);
    } catch (err) {
      console.error("INSTITUTION CREATE ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * PUT /api/admin/institutions/:id
 * Update institution
 */
router.put(
  "/:id",
  auth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const update = req.body;

      const inst = await Institution.findByIdAndUpdate(id, update, {
        new: true,
        runValidators: true,
      });

      if (!inst) return res.status(404).json({ message: "Not found" });

      res.json(inst);
    } catch (err) {
      console.error("INSTITUTION UPDATE ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * DELETE /api/admin/institutions/:id
 * Delete institution
 */
router.delete(
  "/:id",
  auth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const inst = await Institution.findByIdAndDelete(id);
      if (!inst) return res.status(404).json({ message: "Not found" });

      res.json({ message: "Institution deleted" });
    } catch (err) {
      console.error("INSTITUTION DELETE ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/**
 * GET /api/admin/institutions/:id
 * Detail + stats:
 *  - studentCount
 *  - documentCount
 *  - avgGpa
 *  - performanceByYear
 *  - topStudents (basic list)
 */
router.get(
  "/:id",
  auth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const inst = await Institution.findById(id).lean();
      if (!inst) return res.status(404).json({ message: "Not found" });

      // Profiles for that institution (by name)
      const profiles = await StudentProfile.find({
        institution: inst.name,
      }).select("userId fullName admissionNo course year photo");

      const userIds = profiles.map((p) => p.userId);

      // Documents for those users
      const documentCount = await StudentDocument.countDocuments({
        userId: { $in: userIds },
      });

      // Performance records
      const perfRecords = await Performance.find({
        userId: { $in: userIds },
        gpa: { $ne: null },
      }).lean();

      let avgGpa = null;
      if (perfRecords.length) {
        const sum = perfRecords.reduce((acc, p) => acc + (p.gpa || 0), 0);
        avgGpa = +(sum / perfRecords.length).toFixed(2);
      }

      // GPA by year for chart
      const perfByYear = {};
      for (const p of perfRecords) {
        const y = p.yearOfStudy || "Unknown";
        if (!perfByYear[y]) perfByYear[y] = { count: 0, sum: 0 };
        perfByYear[y].count += 1;
        perfByYear[y].sum += p.gpa || 0;
      }

      const performanceByYear = Object.entries(perfByYear)
        .map(([year, v]) => ({
          year,
          avgGpa: +(v.sum / v.count).toFixed(2),
        }))
        .sort((a, b) => a.year.localeCompare(b.year));

      res.json({
        institution: inst,
        stats: {
          studentCount: profiles.length,
          documentCount,
          avgGpa,
          performanceByYear,
        },
        students: profiles,
      });
    } catch (err) {
      console.error("INSTITUTION DETAIL ERROR:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export default router;
