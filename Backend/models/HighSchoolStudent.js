import mongoose from "mongoose";

const highSchoolStudentSchema = new mongoose.Schema(
  {
    // Link to HighSchool institution
    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
    },

    // Student identity
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    registrationNo: {
      type: String,
      trim: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },

    /**
     * Education system
     * - "844" → Form-based
     * - "CBE" → Grade-based
     */
    curriculum: {
      type: String,
      enum: ["844", "CBE"],
      required: true,
    },
    assessmentNo: {
      type: String,
      trim: true,
    },

    indexNo: {
      type: String,
      trim: true,
    },

    /**
     * Level within curriculum
     * Examples:
     *  - 8-4-4 → "Form 3"
     *  - CBE → "Grade 9"
     */
    level: {
      type: String,
      required: true,
    },

    academicYear: {
      type: String, // e.g. "2024"
      required: true,
    },

    // Fees info
    term: {
      type: String,
      enum: ["Term 1", "Term 2", "Term 3"],
      required: true,
    },

    feesAmount: {
      type: Number,
      required: true,
    },

    // Documents
    documents: [
      {
        label: String,
        fileUrl: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // Sponsorship status
    sponsorshipStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "disbursed"],
      default: "pending",
    },

    adminFeedback: {
      type: String,
    },

    // Audit
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // principal / academic master
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model(
  "HighSchoolStudent",
  highSchoolStudentSchema
);
