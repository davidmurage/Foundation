import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: String }, 
    title: String,
    message: String,
    type: { type: String, enum: ["info", "warning", "success", "error"], default: "info" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
