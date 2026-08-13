

import { randomUUID } from 'crypto'
import { StandardCheckoutPayRequest } from 'pg-sdk-node'
import { env } from '../config/env.js'
import { Order } from '../models/Order.js'
import { Application } from '../models/Application.js'
import { Job } from '../models/Job.js'
import { sendEmail } from '../utils/sendEmail.js'

export function makeOrderController(client) {
  return {

    // ============================================================
    // CREATE ORDER
    // ============================================================
    async createOrder(req, res) {
      try {
        const { amount, customerName, mobileNumber, email, note, jobId } = req.body

        // ---------------- Validation ----------------
        if (!amount || typeof amount !== 'number' || amount <= 0)
          return res.status(400).send('Amount must be a positive number in paise')

        if (!customerName?.trim())
          return res.status(400).send('Customer name required')

        if (!/^\d{10}$/.test(mobileNumber))
          return res.status(400).send('Valid 10-digit mobile required')

        let job = null
        if (jobId) {
          job = await Job.findById(jobId)
          if (!job) return res.status(400).send('Job not found')
        }

        const merchantOrderId = randomUUID()

        // ---------------- Save Order ----------------
        await Order.create({
          merchantOrderId,
          amount,
          customerName,
          mobileNumber,
          email,
          note,
          status: 'PENDING',
          jobId
        })

        // ---------------- FIXED: PhonePe callback URL ----------------
        const statusCallback =
          `https://jbackend-h963.onrender.com/check-status?merchantOrderId=${merchantOrderId}`
        const request = StandardCheckoutPayRequest
          .builder()
          .merchantOrderId(merchantOrderId)
          .amount(amount)
          .redirectUrl(statusCallback)
          .build()

        const response = await client.pay(request)

        return res.json({
          checkoutPageUrl: response.redirectUrl,
          merchantOrderId
        })

      } catch (e) {
        console.error('Error creating order:', e)
        return res.status(500).send('Error creating order')
      }
    },


    // ============================================================
    // CHECK ORDER STATUS
    // ============================================================
    async checkStatus(req, res) {
      try {
        const { merchantOrderId } = req.query
        if (!merchantOrderId)
          return res.status(400).send('MerchantOrderId required')

        const response = await client.getOrderStatus(merchantOrderId)
        const status = response.state

        const order = await Order.findOneAndUpdate(
          { merchantOrderId },
          {
            status,
            updatedAt: new Date(),
            lastWebhook: response
          },
          { new: true }
        )

        // ---------------- CREATE APPLICATION ----------------
        if (status === 'COMPLETED') {
          const existing = await Application.findOne({ merchantOrderId })

          if (!existing && order) {
            const job = order.jobId ? await Job.findById(order.jobId) : null

            await Application.create({
              jobId: order.jobId || '',
              jobTitle: job ? job.title : '',
              merchantOrderId,
              txnId: response.transactionId || null,
              applicantName: order.customerName,
              applicantEmail: order.email,
              applicantPhone: order.mobileNumber,
              amount: order.amount
            })
            

            
    // ---------------- EMAIL ----------------
if (job?.postedByEmail) {

  try {

    // =====================================================
    // EMPLOYER / JOB LOCATION
    // Worker ki current location yahan use nahi hogi
    // =====================================================

    const jobLocation = job.location || {};

    const address =
      jobLocation.address || "Not provided";

    const village =
      jobLocation.village || "Not provided";

    const locality =
      jobLocation.locality || "Not provided";

    const district =
      jobLocation.district ||
      job.district ||
      "Not provided";

    const postcode =
      jobLocation.postcode || "Not provided";

    const latitude =
      jobLocation.latitude;

    const longitude =
      jobLocation.longitude;

    // =====================================================
    // MAP LINK
    // =====================================================

    let mapLink = "";

    if (
      latitude !== undefined &&
      latitude !== null &&
      longitude !== undefined &&
      longitude !== null
    ) {
      mapLink = `
        <p>
          <strong>🗺️ Map:</strong>
          <a
            href="https://www.google.com/maps?q=${latitude},${longitude}"
            target="_blank"
            rel="noopener noreferrer"
          >
            View Job Location on Google Maps
          </a>
        </p>
      `;
    }

    // =====================================================
    // SEND EMAIL TO EMPLOYER
    // =====================================================

    await sendEmail({

      to: job.postedByEmail,

      subject: `New Application for ${job.title}`,

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 650px;
          margin: 0 auto;
          padding: 20px;
          color: #222;
        ">

          <h2 style="
            color: #2563eb;
            margin-bottom: 20px;
          ">
            New Job Application
          </h2>

          <p>
            Someone has applied for your job.
          </p>

          <hr />

          <h3>👤 Applicant Details</h3>

          <p>
            <strong>Name:</strong>
            ${order.customerName}
          </p>

          <p>
            <strong>Phone:</strong>
            ${order.mobileNumber}
          </p>

          <p>
            <strong>Email:</strong>
            ${order.email || "N/A"}
          </p>

          <p>
            <strong>Paid:</strong>
            ₹${(order.amount / 100).toFixed(2)}
          </p>

          <hr />

          <h3>💼 Job Details</h3>

          <p>
            <strong>Job:</strong>
            ${job.title}
          </p>

          <p>
            <strong>District:</strong>
            ${job.district || "N/A"}
          </p>

          <hr />

          <h3>📍 Job Location</h3>

          <p>
            <strong>Address:</strong>
            ${address}
          </p>

          <p>
            <strong>Village:</strong>
            ${village}
          </p>

          <p>
            <strong>Locality / Mohalla:</strong>
            ${locality}
          </p>

          <p>
            <strong>District:</strong>
            ${district}
          </p>

          <p>
            <strong>PIN Code:</strong>
            ${postcode}
          </p>

          ${mapLink}

          <hr />

          <p>
            <strong>Merchant Order ID:</strong>
            ${merchantOrderId}
          </p>

          <p style="
            margin-top: 25px;
            color: #666;
            font-size: 13px;
          ">
            This location is the location provided by the
            employer while posting the job.
          </p>

        </div>
      `
    });

    console.log("EMAIL SUCCESS");

  } catch (emailErr) {

    console.error(
      "EMAIL FAILED:",
      emailErr
    );

  }

}
          }
        }

        // ---------------- REDIRECT ----------------
        const successUrl = `${env.frontendUrl}/`
        const failureUrl = `${env.frontendUrl}/failure?merchantOrderId=${encodeURIComponent(merchantOrderId)}`

        return res.redirect(status === 'COMPLETED' ? successUrl : failureUrl)

      } catch (e) {
        console.error('Error checking status:', e)
        return res.status(500).send('Error checking status')
      }
    },


    // ============================================================
    // GET ORDER
    // ============================================================
    async getOrder(req, res) {
      try {
        const order = await Order.findOne({ merchantOrderId: req.params.merchantOrderId })
        if (!order) return res.status(404).send('Order not found')
        res.json(order)
      } catch (e) {
        console.error('Error getting order:', e)
        res.status(500).send('Error getting order')
      }
    },


    // ============================================================
    // LIST ORDERS
    // ============================================================
    async listOrders(req, res) {
      try {
        const orders = await Order.find().sort({ createdAt: -1 })
        res.json({ orders })
      } catch (e) {
        console.error('Error listing orders:', e)
        res.status(500).send('Error listing orders')
      }
    },


    // ============================================================
    // WEBHOOK (SECURE)
    // ============================================================
    async phonepeWebhook(req, res) {
      try {
        const secret =
          req.headers['x-verify-token'] ||
          req.headers['authorization']

        if (!secret || secret !== env.webhookSecret) {
          return res.status(401).send("Unauthorized")
        }

        console.log("Webhook Verified:", req.body)

        const { merchantOrderId, state } = req.body || {}

        if (merchantOrderId && state) {
          await Order.findOneAndUpdate(
            { merchantOrderId },
            { status: state, updatedAt: new Date(), lastWebhook: req.body }
          )
        }

        return res.status(200).send("OK")

      } catch (e) {
        console.error("Webhook error:", e)
        return res.status(500).send("Error")
      }
    }

  }
}