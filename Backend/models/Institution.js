import mongoose from "mongoose";

const institutionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    type: { type: String, enum: ["University", "TVET"], required: true },
    county: { type: String, trim: true },
    location: { type: String, trim: true }, // town / city / campus
    code: { type: String, trim: true },     // optional code
    logoUrl: { type: String, trim: true },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Institution", institutionSchema);
