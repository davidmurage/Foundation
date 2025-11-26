import nodemailer from "nodemailer";

export async function sendEmail({ to, subject, html, text }) {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      service: "gmail",
      port: process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587,
      secure: false, // TLS
      auth: {
        user: process.env.EMAIL_USER, // email account
        pass: process.env.EMAIL_PASS, // app password
      },
    });

    // Email options
    const mailOptions = {
      from: `"KCB Foundation Portal" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: text || "",
      html: html || "",
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log("EMAIL SENT →", info.messageId);

    return { success: true };
  } catch (err) {
    console.error("EMAIL ERROR:", err.message);
    return { success: false, error: err.message };
  }
}
