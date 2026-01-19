import mongoose from "mongoose";

const requestLogSchema = new mongoose.Schema(
  {
    method: { type: String },
    path: { type: String },
    statusCode: { type: Number },
    durationMs: { type: Number },

    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    userRole: { type: String, default: "" },

    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },

    // optional payload notes (safe)
    queryKeys: { type: [String], default: [] },
    bodyKeys: { type: [String], default: [] },
  },
  { timestamps: true }
);

requestLogSchema.index({ createdAt: -1 });
requestLogSchema.index({ statusCode: 1 });
requestLogSchema.index({ path: 1 });

export default mongoose.model("RequestLog", requestLogSchema);
