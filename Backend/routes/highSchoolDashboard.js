import express from "express";
import mongoose from "mongoose";
import auth, { requireRole } from "../middleware/auth.js";
import HighSchoolStudent from "../models/HighSchoolStudent.js";

const router = express.Router();

router.get(
  "/overview",
  auth,
  requireRole("highschool_admin"),
  async (req, res) => {
    try {
      const institutionId = req.user.institution;

      if (!institutionId) {
        return res.status(400).json({
          message: "Institution not linked to admin",
        });
      }

      const institutionObjectId = new mongoose.Types.ObjectId(
        institutionId.toString()
      );

      /* ================= STUDENTS ================= */
      const totalStudents = await HighSchoolStudent.countDocuments({
        institution: institutionObjectId,
      });

      const pendingStudents = await HighSchoolStudent.countDocuments({
        institution: institutionObjectId,
        sponsorshipStatus: "pending",
      });

      /* ================= TOTAL FEES ================= */
      const totalFeesAgg = await HighSchoolStudent.aggregate([
        {
          $match: {
            institution: institutionObjectId,
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$feesAmount" },
          },
        },
      ]);

      /* ================= BY GRADE / FORM ================= */
      const byGrade = await HighSchoolStudent.aggregate([
        {
          $match: {
            institution: institutionObjectId,
          },
        },
        {
          $group: {
            _id: "$level", // Form 1 / Grade 9 etc
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      res.json({
        totalStudents,
        pendingFees: pendingStudents,
        totalFees: totalFeesAgg[0]?.total || 0,
        byGrade,
      });
    } catch (err) {
      console.error("HS DASHBOARD ERROR:", err);
      res.status(500).json({
        message: "Failed to load dashboard data",
      });
    }
  }
);

export default router;
