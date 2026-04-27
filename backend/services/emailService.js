import nodemailer from "nodemailer";

const canSendEmails = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

const transporter = canSendEmails
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  : null;

export const sendEmail = async (to, subject, text) => {
  if (!transporter || !to) {
    console.warn("⚠️ Email skipped: transporter not configured or recipient missing");
    return { success: false, skipped: true };
  }

  try {
    await transporter.sendMail({
      from: `"Vedant Arts Skills" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });

    return { success: true };
  } catch (error) {
    console.error("Email error:", error.message);
    return { success: false, error: error.message };
  }
};
