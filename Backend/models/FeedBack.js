import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },        // e.g. /uploads/xxx.png
    originalName: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    size: { type: Number, default: 0 },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    sender: { type: String, enum: ["user", "admin"], required: true },
    text: { type: String, default: "" },
    attachments: { type: [attachmentSchema], default: [] },

    // read tracking (optional but useful)
    readByUserAt: { type: Date, default: null },
    readByAdminAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const feedbackSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    role: {
      type: String,
      enum: ["admin", "student", "highschool_admin"],
      required: true,
    },

    page: { type: String, required: true },

    status: { type: String, enum: ["open", "resolved"], default: "open" },

    // useful analytics metadata
    lastUserMessageAt: { type: Date, default: null },
    lastAdminReplyAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },

    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true }
);

feedbackSchema.index({ status: 1 });
feedbackSchema.index({ updatedAt: -1 });
feedbackSchema.index({ page: 1 });

export default mongoose.model("Feedback", feedbackSchema);
