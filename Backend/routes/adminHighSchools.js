import express from "express";
import bcrypt from "bcryptjs";
import Institution from "../models/Institution.js";
import auth, { requireRole } from "../middleware/auth.js";
import User from "../models/User.js";
import HighSchoolAdmin from "../models/HighSchoolAdmin.js";


const router = express.Router();

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





export default router;
