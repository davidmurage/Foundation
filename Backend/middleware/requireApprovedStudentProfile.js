import StudentProfile from "../models/StudentProfile.js";

export default async function requireApprovedStudentProfile(req, res, next) {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user.id }).select(
      "status adminFeedback"
    );

    if (!profile) {
      return res.status(403).json({
        status: "incomplete",
        message: "Please complete your profile before using this service.",
      });
    }

    if (profile.status !== "approved") {
      return res.status(403).json({
        status: profile.status || "pending",
        message:
          profile.status === "rejected"
            ? "Your profile was rejected. Please correct your profile and resubmit it for approval."
            : "Your profile is awaiting admin approval.",
        rejectionReason: profile.adminFeedback || null,
      });
    }

    next();
  } catch (err) {
    console.error("PROFILE APPROVAL CHECK ERROR:", err);
    res.status(500).json({ message: "Failed to verify profile approval." });
  }
}
