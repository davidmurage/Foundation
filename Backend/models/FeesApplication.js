import mongoose from "mongoose";

const feeDocSchema = new mongoose.Schema(
  {
    label: { type: String, required: true }, // "Fee Structure", "Fee Statement", "Other"
    fileUrl: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const feeApplicationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    academicYear: { type: String, required: true }, // e.g. 2024/2025
    yearOfStudy: { type: String, required: true }, // 1..5

    institutionType: { type: String, enum: ["University", "TVET"], required: true },
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: "Institution", required: true },
    institutionName: { type: String, required: true },

    academicPeriod: { type: String, required: true }, // Semester 1 / Term 2 etc
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },

    amountRequested: { type: Number, required: true },

    documents: { type: [feeDocSchema], default: [] },

    reviewStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    processingStatus: {
      type: String,
      enum: ["processing", "completed", "disbursed", "paid"],
      default: "processing",
    },

    adminFeedback: { type: String, default: "" },

    version: { type: Number, default: 1 }, // increments on resubmit
  },
  { timestamps: true }
);

export default mongoose.model("FeeApplication", feeApplicationSchema);
