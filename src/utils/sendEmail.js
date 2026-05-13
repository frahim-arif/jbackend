import nodemailer from "nodemailer";
import { env } from "../config/env.js";

export async function sendEmail({ to, subject, html }) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.emailUser,
      pass: env.emailPassApp,
    },
  });

  return await transporter.sendMail({
    from: `"JobHir" <${env.emailUser}>`,
    to,
    subject,
    html,
  });
}