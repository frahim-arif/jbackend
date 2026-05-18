import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html }) {

  try {

    console.log("EMAIL FUNCTION CALLED");

    const result = await resend.emails.send({
      from: "JobHir <noreply@jobhir.com>",
      to,
      subject,
      html,
    });

    console.log("EMAIL SENT", result);

    return result;

  } catch (err) {

    console.error("EMAIL ERROR:", err);

    throw err;
  }
}