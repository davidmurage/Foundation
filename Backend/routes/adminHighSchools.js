import express from "express";
import bcrypt from "bcryptjs";
import Institution from "../models/Institution.js";
import auth, { requireRole } from "../middleware/auth.js";
import User from "../models/User.js";
import HighSchoolAdmin from "../models/HighSchoolAdmin.js";
import HighSchoolStudent from "../models/HighSchoolStudent.js";
import HighSchoolStudentDocument from "../models/HighSchoolStudentDocument.js";
import HighSchoolStudentFeeRecord from "../models/HighSchoolStudentFeeRecord.js";
import HighSchoolStudentPerformance from "../models/HighSchoolStudentPerformance.js";
import AdminActionLog from "../models/AdminActionLog.js";


const router = express.Router();

function requireSystemAdmin(req, res) {
  // Adjust based on your auth payload
  const role = req.user?.role;
  if (!["admin"].includes(role)) {
    res.status(403).json({ message: "Access denied" });
    return false;
  }
  return true;
}

async function logAction({ actor, institution, action, targetType, targetId, meta }) {
  await AdminActionLog.create({
    actor,
    institution,
    action,
    targetType,
    targetId,
    meta: meta || {},
  });
}

/* =========================
   GET ALL HIGH SCHOOLS
========================= */
router.get("/", auth, requireRole("admin"), async (req, res) => {
  try {
    const schools = await Institution.find({
      type: "HighSchool",
    })
      .sort({ name: 1 })
      .select("_id name county location isActive");

    res.json(schools);
  } catch (err) {
    console.error("HIGH SCHOOL FETCH ERROR:", err);
    res.status(500).json({ message: "Failed to load high schools" });
  }
});

/* =========================
   CREATE HIGH SCHOOL
========================= */
router.post("/", auth, requireRole("admin"), async (req, res) => {
  const { name, county, location, isActive } = req.body;

  if (!name) {
    return res.status(400).json({ message: "School name required" });
  }

  const exists = await Institution.findOne({
    name: name.trim(),
    type: "HighSchool",
  });

  if (exists) {
    return res.status(400).json({ message: "High school already exists" });
  }

  const school = await Institution.create({
    name: name.trim(),
    type: "HighSchool",
    county,
    location,
    isActive,
    createdBy: req.user.id,
  });

  res.status(201).json(school);
});

/* =========================
   UPDATE HIGH SCHOOL
========================= */
router.put("/:id", auth, requireRole("admin"), async (req, res) => {
  const updated = await Institution.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(updated);
});

/* =========================
   DELETE HIGH SCHOOL
========================= */
router.delete("/:id", auth, requireRole("admin"), async (req, res) => {
  await Institution.findByIdAndDelete(req.params.id);
  res.json({ message: "High school deleted" });
});

/* CREATE HIGHSCHOOL ADMIN */
router.post(
  "/create-admin",
  auth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { fullName, email, password, institutionId, role } = req.body;

      if (!email || !password || !institutionId || !role) {
        return res.status(400).json({ message: "Missing fields" });
      }

      // Ensure institution exists and is HighSchool
      const institution = await Institution.findOne({
        _id: institutionId,
        type: "HighSchool",
      });

      if (!institution) {
        return res.status(400).json({
          message: "Invalid high school institution",
        });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashed = await bcrypt.hash(password, 10);

      const user = await User.create({
        fullName,
        email,
        password: hashed,
        role: "highschool_admin",
      });

      await HighSchoolAdmin.create({
        user: user._id,
        institution: institution._id,
        role, // Principal | AcademicMaster
      });

      res.status(201).json({
        message: "High school admin created",
      });
    } catch (err) {
      console.error("CREATE HS ADMIN ERROR:", err);
      res.status(500).json({ message: "Failed to create admin" });
    }
  }
);

/* =====================================================
   GET ALL HIGH SCHOOL ADMINS
   ===================================================== */
/* GET ALL HS ADMINS */
router.get(
  "/admins",
  auth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const admins = await HighSchoolAdmin.find({ isActive: true })
        .populate("user", "fullName email")
        .populate("institution", "name")
        .sort({ createdAt: -1 });

      res.json(admins);
    } catch (err) {
      console.error("GET HS ADMINS ERROR:", err);
      res.status(500).json({ message: "Failed to load HS admins" });
    }
  }
);

router.put("/admins/:id", auth, requireRole("admin"), async (req, res) => {
  try {
    const { fullName, role, institutionId } = req.body;

    const admin = await HighSchoolAdmin.findById(req.params.id)
      .populate("user");

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Update linked User
    if (fullName) admin.user.fullName = fullName;
    await admin.user.save();

    // Update admin record
    if (role) admin.role = role;
    if (institutionId) admin.institution = institutionId;

    await admin.save();

    res.json({ message: "Admin updated successfully" });
  } catch (err) {
    console.error("UPDATE HS ADMIN ERROR:", err);
    res.status(500).json({ message: "Update failed" });
  }
});

router.patch(
  "/admins/:id/toggle",
  auth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const admin = await HighSchoolAdmin.findById(req.params.id)
        .populate("user");

      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      admin.isActive = !admin.isActive;
      admin.user.isActive = admin.isActive;

      await admin.user.save();
      await admin.save();

      res.json({
        message: admin.isActive
          ? "Admin activated"
          : "Admin deactivated",
      });
    } catch (err) {
      console.error("TOGGLE ADMIN ERROR:", err);
      res.status(500).json({ message: "Action failed" });
    }
  }
);

router.delete("/admins/:id", auth, requireRole("admin"), async (req, res) => {
  try {
    const admin = await HighSchoolAdmin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    await User.findByIdAndDelete(admin.user);
    await admin.deleteOne();

    res.json({ message: "Admin deleted successfully" });
  } catch (err) {
    console.error("DELETE ADMIN ERROR:", err);
    res.status(500).json({ message: "Delete failed" });
  }
});


/**
 * GET: School Profile Bundle
 *  - institution info
 *  - admins in that school
 *  - students in that school
 *  - fees summary
 *  - latest documents
 *  - activity logs
 */
router.get("/highschools/:schoolId/profile", auth, async (req, res) => {
  try {
    if (!requireSystemAdmin(req, res)) return;

    const { schoolId } = req.params;

    const institution = await Institution.findById(schoolId);
    if (!institution) return res.status(404).json({ message: "School not found" });

    const admins = await HighSchoolAdmin.find({ institution: schoolId })
      .populate("user", "fullName email");

    //const students = await HighSchoolStudent.find({ institution: schoolId }).sort({ createdAt: -1, approvalStatus: 1, });
    const students = await HighSchoolStudent.find(
  { institution: schoolId },
  {
    fullName: 1,
    registrationNo: 1,
    gender: 1,
    curriculum: 1,
    level: 1,
    academicYear: 1,
    /*approvalStatus: 1,*/
    sponsorshipStatus: 1,   // ADD THIS
    approvedAt: 1        // optional
  }
);


    const stats = {
      totalStudents: students.length,
      //approvedStudents: students.filter((s) => (s.approvalStatus || "Pending") === "Approved").length,
      approvedStudents: students.filter((s) => (s.sponsorshipStatus || "Pending") === "Approved").length,
      pendingStudents: students.filter((s) => (s.sponsorshipStatus || "Pending") === "Pending").length,
      rejectedStudents: students.filter((s) => (s.sponsorshipStatus || "Pending") === "Rejected").length,
    };

    // Fees summary: flatten latest fee records
    const feeRecords = await HighSchoolStudentFeeRecord.find({ institution: schoolId })
      .populate("student", "fullName")
      .sort({ createdAt: -1 })
      .limit(200);

    const totalExpected = feeRecords.reduce((sum, r) => sum + Number(r.totalFees || 0), 0);
    const totalPaid = feeRecords.reduce((sum, r) => sum + Number(r.paidAmount || 0), 0);

    const feesSummary = {
      totalExpected,
      totalPaid,
      totalBalance: totalExpected - totalPaid,
      records: feeRecords.map((r) => ({
        _id: r._id,
        studentName: r.student?.fullName || "—",
        academicYear: r.academicYear,
        term: r.term,
        totalFees: r.totalFees,
        paidAmount: r.paidAmount,
      })),
    };

    // Latest documents across school
    const docs = await HighSchoolStudentDocument.find({ institution: schoolId })
      .populate("student", "fullName")
      .sort({ createdAt: -1 })
      .limit(100);

    const documents = docs.map((d) => ({
      _id: d._id,
      studentName: d.student?.fullName || "—",
      title: d.title,
      type: d.type,
      fileUrl: d.fileUrl,
      createdAt: d.createdAt,
    }));

    // Activity logs
    const logs = await AdminActionLog.find({ institution: schoolId })
      .populate("actor", "fullName email")
      .sort({ createdAt: -1 })
      .limit(200);

    const activity = logs.map((x) => ({
      _id: x._id,
      createdAt: x.createdAt,
      action: x.action,
      actorName: x.actor?.fullName || "—",
      targetLabel: `${x.targetType}`,
      metaText: x.meta?.status ? `status: ${x.meta.status}` : "",
    }));

    res.json({ institution, admins, students, stats, feesSummary, documents, activity });
  } catch (err) {
    console.error("ADMIN HS PROFILE ERROR:", err);
    res.status(500).json({ message: "Failed to load admin school profile" });
  }
});

/**
 * GET: Student Profile (admin read-only)
 */
router.get("/students/:studentId/profile", auth, async (req, res) => {
  try {
    if (!requireSystemAdmin(req, res)) return;

    const { studentId } = req.params;
    const student = await HighSchoolStudent.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const [performance, feeRecords, documents] = await Promise.all([
      HighSchoolStudentPerformance.find({ student: studentId }).sort({ createdAt: -1 }),
      HighSchoolStudentFeeRecord.find({ student: studentId }).sort({ createdAt: -1 }),
      HighSchoolStudentDocument.find({ student: studentId }).sort({ createdAt: -1 }),
    ]);

    res.json({ student, performance, feeRecords, documents });
  } catch (err) {
    console.error("ADMIN STUDENT PROFILE ERROR:", err);
    res.status(500).json({ message: "Failed to load student profile" });
  }
});

/**
 * PATCH: Approve/Reject student
 */
router.patch("/students/:studentId/approval", auth, async (req, res) => {
  try {
    if (!requireSystemAdmin(req, res)) return;

    const { studentId } = req.params;
    const { status } = req.body; // "Approved" | "Rejected" | "Pending"

    const normalizedStatus = status.toLowerCase();

    if (!["approved", "rejected", "pending"].includes(normalizedStatus)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const student = await HighSchoolStudent.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    

    //student.approvalStatus = status;
    student.sponsorshipStatus = normalizedStatus;
    student.approvedBy = req.user.id;
    student.approvedAt = new Date();
    await student.save();

    await logAction({
      actor: req.user.id,
      institution: student.institution,
      action: "STUDENT_APPROVAL_CHANGED",
      targetType: "Student",
      targetId: student._id,
      meta: { status },
    });

    res.json({ message: "Updated", student });
  } catch (err) {
    console.error("ADMIN STUDENT APPROVAL ERROR:", err);
    res.status(500).json({ message: "Failed to update approval" });
  }
});





export default router;
