import mongoose from "mongoose";

const feeRecordSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "HighSchoolStudent", required: true },
    institution: { type: mongoose.Schema.Types.ObjectId, ref: "Institution", required: true },

    academicYear: { type: String, required: true, trim: true },
    term: { type: String, required: true, trim: true },

    // structure
    totalFees: { type: Number, required: true },

    breakdown: [
      {
        label: { type: String, trim: true },
        amount: { type: Number },
      },
    ],

    // statement
    paidAmount: { type: Number, default: 0 },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// one record per (student, year, term)
feeRecordSchema.index({ student: 1, academicYear: 1, term: 1 }, { unique: true });

export default mongoose.model("HighSchoolStudentFeeRecord", feeRecordSchema);
