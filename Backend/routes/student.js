import express from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utils/cloudinary.js";
import StudentProfile from "../models/StudentProfile.js";
import auth, { requireRole } from "../middleware/auth.js";
import Settings from "../models/Settings.js";
import { approveStudentProfile, rejectStudentProfile } from "../controllers/approvalController.js";
import Notification from "../models/Notification.js";
import Performance from "../models/Performance.js";
import StudentDocument from "../models/StudentDocument.js";
import User from "../models/User.js";

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

/**
 * GET /api/student/status
 * Returns profile status + message for dashboard
 */
router.get(
  "/status",
  auth,
  requireRole("student"),
  async (req, res) => {
    try {
      const profile = await StudentProfile.findOne({ userId: req.user.id });

      if (!profile) {
        return res.json({
          status: "incomplete",
          message: "Please complete your profile to proceed.",
          rejectionReason: null,
        });
      }

      // Expected possible values: "approved", "rejected", "pending"
      const status = profile.status || "pending";
      let message = "";
      if (status === "approved") {
        message = "Your profile has been approved by the KCB admin team.";
      } else if (status === "rejected") {
        message =
          profile.rejectionMessage ||
          "Your profile was rejected. Please review the feedback and update your details.";
      } else {
        message = "Your profile is awaiting review from the admin team.";
      }

      res.json({
        status,
        message,
        rejectionReason: profile.rejectionReason || null,
      });
    } catch (err) {
      console.error("STATUS ERROR:", err);
      res.status(500).json({ message: "Failed to load profile status." });
    }
  }
);

/**
 * GET /api/student/doc-summary
 * Returns document stats for dashboard
 */
router.get(
  "/doc-summary",
  auth,
  requireRole("student"),
  async (req, res) => {
    try {
      const docs = await StudentDocument.find({ userId: req.user.id });

      const total = docs.length;
      const approved = docs.filter((d) => d.status === "approved").length;
      const rejected = docs.filter((d) => d.status === "rejected").length;
      const pending = docs.filter((d) => !d.status || d.status === "pending")
        .length;

      // You can adjust this logic depending on your rules
      const REQUIRED_DOCS = 3; // e.g. ID, transcript, admission letter
      const missing = Math.max(REQUIRED_DOCS - total, 0);

      res.json({
        total,
        approved,
        rejected,
        pending,
        missing,
      });
    } catch (err) {
      console.error("DOC-SUMMARY ERROR:", err);
      res.status(500).json({ message: "Failed to load document summary." });
    }
  }
);

/**
 * GET /api/student/performance-snap
 * Returns latest GPA + simple trend
 */
router.get(
  "/performance-snap",
  auth,
  requireRole("student"),
  async (req, res) => {
    try {
      const perf = await Performance.find({
        userId: req.user.id,
        gpa: { $ne: null },
      }).sort({ yearOfStudy: 1, academicPeriod: 1, createdAt: 1 });

      if (!perf.length) {
        return res.json({ gpa: null, trend: "none" });
      }

      const latest = perf[perf.length - 1];
      let trend = "none";

      if (perf.length >= 2) {
        const prev = perf[perf.length - 2];
        if (latest.gpa > prev.gpa) trend = "up";
        else if (latest.gpa < prev.gpa) trend = "down";
        else trend = "flat";
      }

      res.json({
        gpa: latest.gpa,
        trend,
      });
    } catch (err) {
      console.error("PERF-SNAP ERROR:", err);
      res.status(500).json({ message: "Failed to load performance data." });
    }
  }
);

/**
 * GET /api/student/notifications
 * Last N notifications for the logged-in student
 */
router.get(
  "/notifications",
  auth,
  requireRole("student"),
  async (req, res) => {
    try {
      const notifs = await Notification.find({
        userId: req.user.id,
      })
        .sort({ createdAt: -1 })
        .limit(20);

      res.json(notifs);
    } catch (err) {
      console.error("NOTIFICATIONS ERROR:", err);
      res.status(500).json({ message: "Failed to load notifications." });
    }
  }
);

export default router;
