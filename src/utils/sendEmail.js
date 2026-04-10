import nodemailer from 'nodemailer'
import { env } from '../config/env.js'

export async function sendEmail({ to, subject, html }) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: env.emailUser,
        pass: env.emailPassApp,
      },
    })

    const info = await transporter.sendMail({
      from: `"JobHir" <${env.emailUser}>`,
      to,
      subject,
      html,
    })

    console.log('Email sent:', info.messageId)
    return { ok: true, info }
  } catch (err) {
    console.error('sendEmail error', err)
    return { ok: false, err }
  }
}
