import nodemailer from "nodemailer";
import { env } from "../config/env.js";

export async function sendEmail({ to, subject, html }) {

  console.log("EMAIL FUNCTION CALLED");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.emailUser,
      pass: env.emailPassApp,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  const info = await transporter.sendMail({
    from: `"JobHir" <${env.emailUser}>`,
    to,
    subject,
    html,
  });

  console.log("EMAIL SENT", info.messageId);

  return info;
}