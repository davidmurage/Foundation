import StudentProfile from "../models/StudentProfile.js";
import User from "../models/User.js";
import { pushNotification } from "../utils/notify.js";
import Settings from "../models/Settings.js";

export const approveStudentProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const profile = await StudentProfile.findOne({ userId });
    profile.status = "approved";
    profile.adminFeedback = "";
    await profile.save();

    const user = await User.findById(userId);
    const settings = await Settings.findOne();

    if (settings.notifications.notifyStudentOnApproval) {
      pushNotification({
        userId,
        title: "Profile Approved",
        message: "Your profile has been approved successfully.",
        email: user.email,
      });
    }

    res.json({ message: "Profile approved!" });
  } catch (err) {
    res.status(500).json({ message: "Failed to approve" });
  }
};

export const rejectStudentProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { feedback } = req.body;

    const profile = await StudentProfile.findOne({ userId });
    profile.status = "rejected";
    profile.adminFeedback = feedback;
    await profile.save();

    const user = await User.findById(userId);
    const settings = await Settings.findOne();

    pushNotification({
      userId,
      title: "Profile Rejected",
      message: `Your profile was rejected: ${feedback}`,
      email: user.email
    });

    res.json({ message: "Profile rejected and student notified" });
  } catch (err) {
    res.status(500).json({ message: "Failed to reject profile" });
  }
};

