// import nodemailer from "nodemailer";
// import { env } from "../../config/env.js";

// export async function sendEmail(to, subject, message) {
//   try {
//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: env.emailUser || process.env.EMAIL_USER,
//         pass: env.emailPass || process.env.EMAIL_PASS_APP,
//       },
//     });

//     await transporter.sendMail({
//       from: env.emailUser,
//       to,
//       subject,
//       html: message,
//     });

//     console.log("📧 Email Sent Successfully");
//   } catch (error) {
//     console.error("❌ Email Send Failed:", error);
//   }
// }
