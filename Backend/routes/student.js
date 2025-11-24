import express from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utils/cloudinary.js";
import StudentProfile from "../models/StudentProfile.js";
import auth, { requireRole } from "../middleware/auth.js";
import Settings from "../models/Settings.js";
import { approveStudentProfile, rejectStudentProfile } from "../controllers/approvalController.js";

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
router.post(
  "/profile",
  auth,
  requireRole("student"),
  upload.single("photo"),
  async (req, res) => {
    try {
      console.log("REQ.USER:", req.user);
      console.log("REQ.BODY:", req.body);
      console.log("REQ.FILE:", req.file);

      const { admissionNo, course, year, institution, contact } = req.body;

      // CHECK IF PROFILE ALREADY EXISTS
      const existingProfile = await StudentProfile.findOne({
        userId: req.user.id,
      });

      const isFirstTime = !existingProfile;

      // PREPARE DATA
      const profileData = {
        userId: req.user.id,
        admissionNo,
        course,
        year,
        institution,
        contact,
        photo: req.file ? req.file.path : existingProfile?.photo || null,
      };

      // SAVE PROFILE
      const profile = await StudentProfile.findOneAndUpdate(
        { userId: req.user.id },
        profileData,
        { upsert: true, new: true }
      );

      // FIRE NOTIFICATION ONLY IF IT'S FIRST TIME
      if (isFirstTime) {
        const student = await User.findById(req.user.id);
        const settings = await Settings.findOne(); // your settings model
        const adminId = settings?.system?.adminUserId || null; // OPTIONAL — depends on your implementation

        if (settings?.notifications?.notifyAdminOnNewStudent) {
          await pushNotification({
            userId: adminId,
            title: "New Student Registered",
            message: `${student.fullName} just created a profile.`,
            email: settings.system.notificationEmail,
          });
        }
      }

      return res.json(profile);
    } catch (err) {
      console.error("PROFILE ERROR:", err);
      res.status(500).json({ message: err.message });
    }
  }
);


// Get current student profile
router.get("/profile", auth, requireRole('student'), async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user.id });
    if (!profile) return res.json(null);
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:userId/approve", auth, requireRole("admin"), approveStudentProfile);
router.put("/:userId/reject", auth, requireRole("admin"), rejectStudentProfile);

export default router;
