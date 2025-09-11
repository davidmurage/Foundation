import express from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utils/cloudinary.js";
import StudentProfile from "../models/StudentProfile.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "kcb_profiles",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

const upload = multer({ storage });

// Create/Update Profile
router.post("/profile", authMiddleware, upload.single("photo"), async (req, res) => {
  try {
    const { admissionNo, course, year, institution, contact } = req.body;

    const profileData = {
      userId: req.user.id,
      admissionNo,
      course,
      year,
      institution,
      contact,
      photo: req.file ? req.file.path : null, // Cloudinary URL
    };

    const profile = await StudentProfile.findOneAndUpdate(
      { userId: req.user.id },
      profileData,
      { upsert: true, new: true }
    );

    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get current student profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user.id });
    if (!profile) return res.json(null);
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
