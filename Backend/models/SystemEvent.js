import mongoose from "mongoose";

const systemEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["INFO", "WARN", "ERROR", "SECURITY", "AUDIT"],
      default: "INFO",
    },
    title: { type: String, required: true },
    message: { type: String, default: "" },

    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    actorRole: { type: String, default: "" },

    meta: { type: Object, default: {} }, // safe structured data
  },
  { timestamps: true }
);

systemEventSchema.index({ createdAt: -1 });
systemEventSchema.index({ type: 1 });

export default mongoose.model("SystemEvent", systemEventSchema);
