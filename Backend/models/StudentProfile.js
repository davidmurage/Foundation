import mongoose from "mongoose";

const studentProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  admissionNo: String,
  course: String,
  year: String,

  institutionType: {
    type: String,
    enum: ["University", "TVET"],
    required: true
  },

  institution: { type: mongoose.Schema.Types.ObjectId, ref: "Institution" },   // actual university / tvet name
  institutionName:{type: String, required: true},
  academicPeriod: String, // Semester 1 / Term 2

  contact: String,
  photo: String,

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },

  adminFeedback: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.model("StudentProfile", studentProfileSchema);
