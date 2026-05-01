import StudentProfile from "../models/StudentProfile.js";
import User from "../models/User.js";
import { pushNotification } from "../utils/notify.js";
import Settings from "../models/Settings.js";

export const approveStudentProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const profile = await StudentProfile.findOne({ userId });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    profile.status = "approved";
    profile.adminFeedback = "";
    await profile.save();

    const user = await User.findById(userId);
    const settings = await Settings.findOne();

    if (settings?.notifications?.notifyStudentOnApproval && user?.email) {
      await pushNotification({
        userId,
        title: "Profile Approved",
        message: "Your profile has been approved successfully.",
        email: user.email,
      });
    }

    res.json({ message: "Profile approved!", profile });
  } catch (err) {
    res.status(500).json({ message: "Failed to approve" });
  }
};

export const rejectStudentProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const feedback = (req.body.feedback || req.body.message || "").trim();

    if (!feedback) {
      return res.status(400).json({ message: "Rejection reason required" });
    }

    const profile = await StudentProfile.findOne({ userId });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    profile.status = "rejected";
    profile.adminFeedback = feedback;
    await profile.save();

    const user = await User.findById(userId);

    if (user?.email) {
      try {
        await pushNotification({
          userId,
          title: "Profile Rejected",
          message: `Your profile was rejected: ${feedback}`,
          email: user.email,
        });
      } catch (notifyErr) {
        console.error("PROFILE REJECTION NOTIFY ERROR:", notifyErr);
      }
    }

    res.json({ message: "Profile rejected and student notified", profile });
  } catch (err) {
    console.error("PROFILE REJECT ERROR:", err);
    res.status(500).json({ message: err.message || "Failed to reject profile" });
  }
};

