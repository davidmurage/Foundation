import mongoose from "mongoose";

const studentDocumentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    yearOfStudy: { type: String, required: true }, // new field
    admissionNo: { type: String, required: true },
    institutionType: { type: String, enum: ["University", "TVET"], required: true }, // classification
    academicPeriod: { type: String, required: true }, // e.g. "Semester 1" or "Term 2"
    documentType: { 
      type: String, 
      enum: ["Fee Structure", "Fee Statement", "Transcript", "Department Letter"], 
      required: true 
    },
    fileUrl: { type: String, required: true }, // Cloudinary URL
  },
  { timestamps: true }
);

export default mongoose.model("StudentDocument", studentDocumentSchema);
