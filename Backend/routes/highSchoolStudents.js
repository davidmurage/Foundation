import express from "express";
import auth from "../middleware/auth.js";


import HighSchoolAdmin from "../models/HighSchoolAdmin.js";
import HighSchoolStudent from "../models/HighSchoolStudent.js";

import multer from "multer";
import csv from "csv-parser";
import fs from "fs";

const upload = multer({ dest: "uploads/" });

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

router.post("/bulk", auth, upload.single("file"), async (req, res) => {
  try {
    const admin = await HighSchoolAdmin.findOne({
      user: req.user.id,
      isActive: true,
    });

    if (!admin) return res.status(403).json({ message: "Access denied" });

    const students = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => {
        students.push({
          ...row,
          institution: admin.institution,
          createdBy: req.user.id,
          sponsorshipStatus: "pending",
        });
      })
      .on("end", async () => {
        await HighSchoolStudent.insertMany(students);
        fs.unlinkSync(req.file.path);
        res.json({ message: "Bulk upload completed" });
      });
  } catch (err) {
    console.error("BULK ERROR:", err);
    res.status(500).json({ message: "Bulk import failed" });
  }
});

router.put("/:id", auth, async (req, res) => {
  try {
    const admin = await HighSchoolAdmin.findOne({
      user: req.user.id,
      isActive: true,
    });

    if (!admin) {
      return res.status(403).json({ message: "Access denied" });
    }

    const student = await HighSchoolStudent.findOneAndUpdate(
      { _id: req.params.id, institution: admin.institution },
      req.body,
      { new: true }
    );

    res.json(student);
  } catch (err) {
    console.error("HS UPDATE ERROR:", err);
    res.status(500).json({ message: "Failed to update student" });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const admin = await HighSchoolAdmin.findOne({
      user: req.user.id,
      isActive: true,
    });

    if (!admin) {
      return res.status(403).json({ message: "Access denied" });
    }

    await HighSchoolStudent.findOneAndDelete({
      _id: req.params.id,
      institution: admin.institution,
    });

    res.json({ message: "Student deleted" });
  } catch (err) {
    console.error("HS DELETE ERROR:", err);
    res.status(500).json({ message: "Failed to delete student" });
  }
});



export default router;
