import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: String,
      enum: ["user", "admin"],
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const feedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "student", "highschool_admin"],
      required: true,
    },

    page: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["open", "resolved"],
      default: "open",
    },

    messages: [messageSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Feedback", feedbackSchema);
