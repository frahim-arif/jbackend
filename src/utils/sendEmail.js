import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html }) {
  const result = await resend.emails.send({
    from: "JobHir <onboarding@resend.dev>",
    to,
    subject,
    html,
  });

  console.log("EMAIL SENT", result);
  return result;
}