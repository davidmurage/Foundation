import mongoose from "mongoose";
import { type } from "os";

const InstitutionReportSchema = new mongoose.Schema(
  {
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
    },
    institutionType: {
      type: String,
      enum: ["University", "TVET", "HighSchool"],
      required: true,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    summary: Object,     // snapshot of analysis
    analysis:{
      type: Object,
      required: true
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("InstitutionReport", InstitutionReportSchema);
