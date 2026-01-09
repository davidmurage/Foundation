import mongoose from "mongoose";

const highSchoolStudentDocumentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "HighSchoolStudent", required: true },
    institution: { type: mongoose.Schema.Types.ObjectId, ref: "Institution", required: true },

    type: {
      type: String,
      enum: ["performance", "fee_structure", "fee_statement", "other"],
      required: true,
    },

    title: { type: String, trim: true },
    fileUrl: { type: String, required: true }, // local uploads or cloud URL
    originalName: { type: String, trim: true },

    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("HighSchoolStudentDocument", highSchoolStudentDocumentSchema);
