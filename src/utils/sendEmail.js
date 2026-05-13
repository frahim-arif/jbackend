import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { sendEmail } from "../utils/sendEmail.js"

export async function sendEmail({ to, subject, html }) {

  console.log("EMAIL FUNCTION CALLED");

  console.log(env.emailUser);
  console.log(env.emailPassApp ? "PASS FOUND" : "NO PASS");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.emailUser,
      pass: env.emailPassApp,
    },
  });

  await transporter.verify();

  console.log("SMTP READY");

  const info = await transporter.sendMail({
    from: `"JobHir" <${env.emailUser}>`,
    to,
    subject,
    html,
  });

  console.log("EMAIL SENT", info.messageId);

  return info;
}