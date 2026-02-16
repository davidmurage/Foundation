import mongoose from "mongoose";

const highSchoolStudentPerformanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HighSchoolStudent",
      required: true,
    },

    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
    },

    curriculum: {
      type: String,
      enum: ["CBC", "844"],
      required: true,
    },

    academicYear: {
      type: String,
      required: true,
      trim: true,
    },

    term: {
      type: String,
      required: true,
      trim: true,
    },

    examName: {
      type: String,
      trim: true,
      default: "End Term",
    },

    /* ===== 8-4-4 ONLY ===== */
    meanScore: {
      type: Number,
      required: function () {
        return this.curriculum === "844";
      },
    },

    meanGrade: {
      type: String,
      trim: true,
      required: function () {
        return this.curriculum === "844";
      },
    },

    /* ===== CBC ONLY ===== */
    competencyLevel: {
      type: String,
      enum: [
        "Exceeds Expectations",
        "Meets Expectations",
        "Approaching Expectations",
        "Below Expectations",
      ],
      required: function () {
        return this.curriculum === "CBC";
      },
    },

    learningArea: {
      type: String,
      trim: true,
      required: function () {
        return this.curriculum === "CBC";
      },
    },

    remarks: {
      type: String,
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model(
  "HighSchoolStudentPerformance",
  highSchoolStudentPerformanceSchema
);
