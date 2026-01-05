import express from "express";
import Institution from "../models/Institution.js";
import auth, { requireRole } from "../middleware/auth.js";

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

export default router;
