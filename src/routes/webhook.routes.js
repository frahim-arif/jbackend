import { Router } from "express";
import { sendEmail } from "./sendEmail.js";
import { Job } from "../../models/Job.js";

const router = Router();

router.post("/phonepe/webhook", async (req, res) => {
  try {
    const data = req.body;

    // Only handle payment success
    if (data.event === "checkout.order.completed") {

      const orderId = data.data.merchantOrderId;

      // Find job linked with this payment/order
      const job = await Job.findOne({ orderId });

      if (job && job.postedByEmail) {
        await sendEmail(
          job.postedByEmail,
          "Payment Successful!",
          `
            <h2>Hi, Your job offer is successful!</h2>
            <p>Job Title: ${job.title}</p>
            <p>Amount Paid: ₹${job.amount}</p>
            <p>District: ${job.district}</p>
            <br/>
            <p>Thank you for using our service.</p>
          `
        );
      }

      console.log("✔ Email Triggered from webhook");
    }

    res.status(200).json({ success: true });
  } catch (e) {
    console.error("❌ Webhook Handling Error:", e);
    res.status(500).json({ success: false });
  }
});

export default router;
