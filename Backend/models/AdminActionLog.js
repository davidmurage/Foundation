import mongoose from "mongoose";

const AdminActionLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    institution: { type: mongoose.Schema.Types.ObjectId, ref: "Institution" },

    action: { type: String, required: true }, // e.g. "STUDENT_APPROVED"
    targetType: { type: String, required: true }, // "Student" | "School"
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },

    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model("AdminActionLog", AdminActionLogSchema);
