import mongoose from "mongoose";

const performanceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    yearOfStudy: { type: String, required: true },
    academicPeriod: { type: String, required: true }, // "Semester 1" / "Term 2"
    gpa: { type: Number, default: null },
    rawAverage: { type: Number, default: null },       // keep original percentage
    meanGrade: { type: String, default: null },        // keep A–E grade if present
    status: { type: String, enum: ["complete", "pending"], default: "pending" },
    sourceDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: "StudentDocument" },
  },
  { timestamps: true }
);

performanceSchema.index({ userId: 1, yearOfStudy: 1, academicPeriod: 1 }, { unique: true });

export default mongoose.model("Performance", performanceSchema);
