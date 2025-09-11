import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ fullName, email, password: hashedPassword, role });
    await newUser.save();

    res.json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "SECRET_KEY",
      { expiresIn: "1d" }
    );

    // Check if student profile exists
    let profileIncomplete = false;
    if (user.role === "student") {
      const profile = await StudentProfile.findOne({ userId: user._id });
      if (!profile) profileIncomplete = true;
    }

    res.json({
      token,
      role: user.role,
      profileIncomplete,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
