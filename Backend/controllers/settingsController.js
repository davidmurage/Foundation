import Settings from "../models/Settings.js";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import Notification from "../models/Notification.js";

export const getSettingsDoc = async () => {
  let doc = await Settings.findOne({});
  if (!doc) {
    doc = await Settings.create({});
  }
  return doc;
};

// GET profile
export const getProfile = async (req, res) => {
  const settings = await getSettingsDoc();
  res.json(settings.profile);
};

// UPDATE profile
export const updateProfile = async (req, res) => {
  const settings = await getSettingsDoc();
  settings.profile = req.body;
  await settings.save();
  res.json({ message: "Profile updated", profile: settings.profile });
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const admin = await User.findById(req.user._id);
  if (!admin) return res.status(404).json({ message: "Admin not found" });

  const isMatch = await bcrypt.compare(currentPassword, admin.password);
  if (!isMatch) return res.status(400).json({ message: "Incorrect password" });

  admin.password = await bcrypt.hash(newPassword, 10);
  await admin.save();

  res.json({ message: "Password changed successfully" });
};

export const getNotifications = async (req, res) => {
  const settings = await getSettingsDoc();
  res.json(settings.notifications);
};

export const updateNotifications = async (req, res) => {
  const settings = await getSettingsDoc();
  settings.notifications = { ...settings.notifications, ...req.body };
  await settings.save();
  res.json({ message: "Notification settings updated" });
};

export const getAdminNotifications = async (req, res) => {
  try {
    const notes = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: "Failed to load notifications" });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update" });
  }
};

export const getSecurity = async (req, res) => {
  const settings = await getSettingsDoc();
  res.json(settings.security);
};

export const updateSecurity = async (req, res) => {
  const settings = await getSettingsDoc();
  settings.security = { ...settings.security, ...req.body };
  await settings.save();
  res.json({ message: "Security settings updated" });
};

export const getAuditLogs = async (req, res) => {
  const logs = await AuditLog.find({})
    .sort({ timestamp: -1 })
    .limit(100);

  res.json(logs);
};

export const getSystem = async (req, res) => {
  try {
    const settings = await getSettingsDoc();
    res.json(settings.system);
  } catch (error) {
    console.error("GET SYSTEM SETTINGS ERROR:", error);
    res.status(500).json({ message: "Failed to load system settings" });
  }
};

export const updateSystem = async (req, res) => {
  try {
    const settings = await getSettingsDoc();
    settings.system = { ...settings.system, ...req.body };
    await settings.save();

    res.json({ message: "System settings updated", system: settings.system });
  } catch (error) {
    console.error("UPDATE SYSTEM SETTINGS ERROR:", error);
    res.status(500).json({ message: "Failed to update system settings" });
  }
};