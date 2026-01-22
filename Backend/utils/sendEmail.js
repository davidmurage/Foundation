import nodemailer from "nodemailer";

export async function sendEmail({to, subject, html, text }) {
  if (!to) {
    throw new Error("No recipient email provided");
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      service: "gmail",
      port: Number(process.env.EMAIL_PORT) || 465,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"KCB Foundation Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: text || undefined,
      html: html || undefined,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("EMAIL SENT →", info.messageId);

    return { success: true };
  } catch (err) {
    console.error("EMAIL ERROR:", err);
    return { success: false, error: err.message };
  }
}
