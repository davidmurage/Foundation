// routes/adminInstitutions.js
import express from "express";
import Institution from "../models/Institution.js";
import auth, { requireRole } from "../middleware/auth.js";

const router = express.Router();

/* CREATE */
router.post("/", auth, requireRole("admin"), async (req, res) => {
  const { name, type, county, location, isActive } = req.body;
  if (!name || !type) {
    return res.status(400).json({ message: "Name and type required" });
  }

  const exists = await Institution.findOne({ name: name.trim() });
  if (exists) return res.status(400).json({ message: "Institution exists" });

  const inst = await Institution.create({
    name: name.trim(),
    type,
    county,
    location,
    isActive,
    createdBy: req.user.id,
  });

  res.status(201).json(inst);
});

/* READ */
router.get("/", async (req, res) => {
  try {
    const { type } = req.query;

    const filter = { isActive: true };
    if (type) filter.type = type;

    const institutions = await Institution.find(filter)
      .sort({ name: 1 })
      .select("_id name type");

    res.json(institutions);
  } catch (err) {
    console.error("INSTITUTION FETCH ERROR:", err);
    res.status(500).json({ message: "Failed to load institutions" });
  }
});


/* UPDATE */
router.put("/:id", auth, requireRole("admin"), async (req, res) => {
  const updated = await Institution.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(updated);
});

/* DELETE */
router.delete("/:id", auth, requireRole("admin"), async (req, res) => {
  await Institution.findByIdAndDelete(req.params.id);
  res.json({ message: "Institution deleted" });
});


export default router;
