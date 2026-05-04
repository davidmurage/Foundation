import mongoose from "mongoose";

const highSchoolAdminSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
    },

    role: {
      type: String,
      enum: ["Principal", "AcademicMaster"],
      required: true,
    },

    contact: {
      type: String,
      default: "",
      trim: true,
    },

    schoolContact: {
      type: String,
      default: "",
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model(
  "HighSchoolAdmin",
  highSchoolAdminSchema
);
