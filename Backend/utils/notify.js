import Notification from "../models/Notification.js";
import Settings from "../models/Settings.js";
import { sendEmail } from "./sendEmail.js";

export const pushNotification = async (opts) => {
  const { userId, title, message, email } = opts;

  await Notification.create({ userId, title, message });

  if (email) {
    await sendEmail(email, title, message);
  }
};
