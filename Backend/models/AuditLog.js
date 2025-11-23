import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    actorName: String,
    actorEmail: String,

    action: { type: String, required: true },
    details: String,

    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export default mongoose.model("AuditLog", auditLogSchema);
