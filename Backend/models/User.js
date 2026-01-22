import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
  type: String,
  enum: ["admin", "student", "highschool_admin"],
  required: true,
},
  otpCode: String,
  otpExpiry: Date,
  resetToken: { type: String },
  resetTokenExpiry: { type: Date }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
