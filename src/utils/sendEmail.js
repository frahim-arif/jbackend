import nodemailer from "nodemailer";
import { env } from "../config/env.js";

export async function sendEmail({ to, subject, html }) {

  console.log("EMAIL FUNCTION CALLED");

  console.log(env.emailUser);
  console.log(env.emailPassApp ? "PASS FOUND" : "NO PASS");

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: env.emailUser,
      pass: env.emailPassApp,
    },
  });

  try {
    await transporter.verify();
    console.log("SMTP READY");
  } catch (err) {
    console.error("SMTP ERROR", err);
  }

  const info = await transporter.sendMail({
    from: `"JobHir" <${env.emailUser}>`,
    to,
    subject,
    html,
  });

  console.log("EMAIL SENT", info.messageId);

  return info;
}