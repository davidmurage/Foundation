// routes/adminInstitutions.js
import express from "express";
import Institution from "../models/Institution.js";
import StudentProfile from "../models/StudentProfile.js";
import auth, { requireRole } from "../middleware/auth.js";
import multer from "multer";
import csv from "csvtojson";
import fs from "fs";

const upload = multer({ dest: "uploads/" });

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

    const match = { isActive: true };
    if (type) match.type = type;

    const institutions = await Institution.aggregate([
      { $match: match },

      {
        $lookup: {
          from: "studentprofiles", //Mongo collection name
          localField: "_id",
          foreignField: "institution",
          as: "students",
        },
      },

      {
        $addFields: {
          studentCount: { $size: "$students" },
        },
      },

      {
        $project: {
          students: 0, // remove large array
        },
      },

      { $sort: { name: 1 } },
    ]);

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

router.post(
  "/bulk-upload",
  auth,
  requireRole("admin"),
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const rows = await csv().fromFile(req.file.path);

      let added = 0;
      let skipped = 0;

      for (const row of rows) {
        if (!row.name || !row.type) {
          skipped++;
          continue;
        }

        const exists = await Institution.findOne({
          name: row.name.trim(),
        });

        if (exists) {
          skipped++;
          continue;
        }

        await Institution.create({
          name: row.name.trim(),
          type: row.type,
          county: row.county || "",
          location: row.location || "",
          createdBy: req.user.id,
        });

        added++;
      }

      fs.unlinkSync(req.file.path);

      res.json({
        message: "Bulk upload complete",
        added,
        skipped,
      });
    } catch (err) {
      console.error("BULK UPLOAD ERROR:", err);
      res.status(500).json({ message: "Bulk upload failed" });
    }
  }
);


export default router;
