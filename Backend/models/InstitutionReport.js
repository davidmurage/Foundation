import mongoose from "mongoose";

const InstitutionReportSchema = new mongoose.Schema(
  {
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      default: null,
      index: true,
    },

    institutionType: {
      type: String,
      enum: ["University", "TVET", "HighSchool", "Campus", "All"],
      required: true,
      index: true,
    },

    reportScope: {
      type: String,
      enum: ["institution", "campus", "highschool", "all"],
      default: "institution",
      index: true,
    },

    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /**
     * FULL analysis snapshot.
     * This is the single source of truth.
     * Frontend, PDF, Excel all read from here.
     */
    analysis: {
      type: Object,
      required: true,
    },
  },
  {
    timestamps: true, // creates createdAt & updatedAt
  }
);

/* Helpful indexes for performance */
InstitutionReportSchema.index({ createdAt: -1 });
InstitutionReportSchema.index({ institution: 1, createdAt: -1 });

export default mongoose.model("InstitutionReport", InstitutionReportSchema);
