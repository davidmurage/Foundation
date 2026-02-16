import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    profile: {
      fullName: String,
      email: String,
      avatarUrl: String,
    },

    system: {
      systemName: { type: String, default: "KCB Foundation Scholarship Portal" },
      academicYear: String,
      minGpa: { type: Number, default: 2.0 },
      maxDocsPerStudent: { type: Number, default: 10 },
      portalStatus: { type: String, default: "open" },
      notificationEmail: String,
    },

    notifications: {
      notifyAdminOnNewStudent: { type: Boolean, default: true },
      notifyAdminOnNewDocument: { type: Boolean, default: true },
      notifyStudentOnApproval: { type: Boolean, default: true },
      sendProfileReminder: { type: Boolean, default: true },
      sendMissingDocsReminder: { type: Boolean, default: false },
    },

    security: {
      enforceStrongPassword: { type: Boolean, default: true },
      sessionTimeoutMinutes: { type: Number, default: 60 },
      allowTwoFactorAuth: { type: Boolean, default: false },
      maxUploadSizeMb: { type: Number, default: 5 },
      allowedFileTypes: { type: String, default: "pdf" },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Settings", settingsSchema);
