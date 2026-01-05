import mongoose from "mongoose";

const highSchoolStudentSchema = new mongoose.Schema(
  {
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
    },

    fullName: { type: String, required: true },
    gender: { type: String, enum: ["Male", "Female"], required: true },

    // CBC + 8-4-4 support
    educationSystem: {
      type: String,
      enum: ["CBC", "844"],
      required: true,
    },

    gradeOrForm: {
      type: String, // Grade 6, Grade 7, Form 3, etc
      required: true,
    },

    academicPeriod: {
      type: String, // Term 1, Term 2, Term 3
      required: true,
    },

    feesAmount: { type: Number, required: true },

    documents: [
      {
        label: String,
        fileUrl: String,
      },
    ],

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // School Admin
    },
  },
  { timestamps: true }
);

export default mongoose.model(
  "HighSchoolStudent",
  highSchoolStudentSchema
);
