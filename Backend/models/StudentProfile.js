import mongoose from "mongoose";

const studentProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  admissionNo: String,
  course: String,
  year: String,
  institution: String,
  contact: String,
  photo: String, // Cloudinary URL
  status: {
  type: String,
  enum: ["pending", "approved", "rejected"],
  default: "pending"
},
adminFeedback: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.model("StudentProfile", studentProfileSchema);
