import { Router } from "express"
import { sendEmail } from "./sendEmail.js"
import { Job } from "../../models/Job.js"
import { Order } from "../../models/Order.js"
import { env } from "../../config/env.js"

const router = Router()

router.post("/phonepe/webhook", async (req, res) => {
  try {
    const data = req.body

    console.log("🔥 Webhook received:", data)

    // =========================
    // 1. SECURITY CHECK (IMPORTANT)
    // =========================
    const secret =
      req.headers["x-verify-token"] ||
      req.headers["authorization"]

    if (!secret || secret !== env.webhookSecret) {
      return res.status(401).json({ success: false, message: "Unauthorized" })
    }

    // =========================
    // 2. EXTRACT ORDER ID
    // =========================
    const merchantOrderId =
      data?.merchantOrderId ||
      data?.data?.merchantOrderId

    const state =
      data?.state ||
      data?.data?.state

    if (!merchantOrderId) {
      return res.status(400).json({ success: false, message: "No order id" })
    }

    // =========================
    // 3. UPDATE ORDER
    // =========================
    await Order.findOneAndUpdate(
      { merchantOrderId },
      {
        status: state,
        lastWebhook: data,
        updatedAt: new Date()
      }
    )

    // =========================
    // 4. SUCCESS ONLY
    // =========================
    if (state === "COMPLETED") {

      const order = await Order.findOne({ merchantOrderId })

      if (order?.jobId) {
        const job = await Job.findById(order.jobId)

        if (job?.postedByEmail) {
          await sendEmail(
            job.postedByEmail,
            "Payment Successful!",
            `
              <h2>Payment Received 🎉</h2>
              <p><b>Job:</b> ${job.title}</p>
              <p><b>Amount:</b> ₹${order.amount / 100}</p>
              <p><b>Applicant:</b> ${order.customerName}</p>
              <p><b>Phone:</b> ${order.mobileNumber}</p>
              <p><b>Order ID:</b> ${merchantOrderId}</p>
            `
          )
        }
      }

      console.log("✔ Payment Success Email Sent")
    }

    return res.status(200).json({ success: true })

  } catch (e) {
    console.error("❌ Webhook Error:", e)
    return res.status(500).json({ success: false })
  }
})

export default router