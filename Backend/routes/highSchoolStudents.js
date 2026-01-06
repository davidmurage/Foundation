import express from "express";
import auth from "../middleware/auth.js";


import HighSchoolAdmin from "../models/HighSchoolAdmin.js";
import HighSchoolStudent from "../models/HighSchoolStudent.js";

const router = express.Router();

/**
 * GET STUDENTS (school-scoped)
 */
router.get("/", auth, async (req, res) => {
  try {
    const admin = await HighSchoolAdmin.findOne({
      user: req.user.id,
      isActive: true,
    });

    if (!admin) {
      return res.status(403).json({ message: "Access denied" });
    }

    const students = await HighSchoolStudent.find({
      institution: admin.institution,
    }).sort({ createdAt: -1 });

    res.json(students);
  } catch (err) {
    console.error("HS FETCH ERROR:", err);
    res.status(500).json({ message: "Failed to load students" });
  }
});

/**
 * CREATE STUDENT
 */
router.post("/", auth, async (req, res) => {
  try {
    const admin = await HighSchoolAdmin.findOne({
      user: req.user.id,
      isActive: true,
    });

    if (!admin) {
      return res.status(403).json({ message: "Access denied" });
    }

    const student = await HighSchoolStudent.create({
      ...req.body,
      institution: admin.institution,
      createdBy: req.user.id,
    });

    res.status(201).json(student);
  } catch (err) {
    console.error("HS CREATE ERROR:", err);
    res.status(500).json({ message: "Failed to add student" });
  }
});

export default router;
