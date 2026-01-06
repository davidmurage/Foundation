import mongoose from "mongoose";

const highSchoolFeeTransactionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HighSchoolStudent",
      required: true,
    },

    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
    },

    term: {
      type: String,
      enum: ["Term 1", "Term 2", "Term 3"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["approved", "disbursed", "paid"],
      default: "approved",
    },

    disbursedAt: Date,
    paidAt: Date,

    reference: String, // EFT / Cheque / Bank ref

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model(
  "HighSchoolFeeTransaction",
  highSchoolFeeTransactionSchema
);
