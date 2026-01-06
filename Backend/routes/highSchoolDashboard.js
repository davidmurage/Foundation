import express from "express";
import auth, { requireRole } from "../middleware/auth.js";
import StudentProfile from "../models/StudentProfile.js";
import FeesApplication from "../models/FeesApplication.js";

const router = express.Router();

router.get(
  "/overview",
  auth,
  requireRole("highschool_admin"),
  async (req, res) => {
    try {
      const institutionId = req.user.institution;

      const totalStudents = await StudentProfile.countDocuments({
        institution: institutionId,
      });

      const pendingFees = await FeesApplication.countDocuments({
        institutionId,
        reviewStatus: "pending",
      });

      const totalFees = await FeesApplication.aggregate([
        { $match: { institutionId } },
        {
          $group: {
            _id: null,
            total: { $sum: "$amountRequested" },
          },
        },
      ]);

      const byGrade = await StudentProfile.aggregate([
        { $match: { institution: institutionId } },
        {
          $group: {
            _id: "$academicLevel", // Grade / Form
            count: { $sum: 1 },
          },
        },
      ]);

      res.json({
        totalStudents,
        pendingFees,
        totalFees: totalFees[0]?.total || 0,
        byGrade,
      });
    } catch (err) {
      console.error("HS DASHBOARD ERROR:", err);
      res.status(500).json({ message: "Failed to load dashboard data" });
    }
  }
);

export default router;
