// models/Institution.js
import mongoose from "mongoose";

const institutionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    type: { type: String, enum: ["University", "TVET", "HighSchool"], required: true },
    county: String,
    location: String,
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// INDEXES
institutionSchema.index({ type: 1 });
institutionSchema.index({ name: 1 });
institutionSchema.index({ isActive: 1 });

export default mongoose.model("Institution", institutionSchema);
