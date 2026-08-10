

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

                await sendEmail({
                  to: job.postedByEmail,
                  subject: `New Application for ${job.title}`,
                  html: `
        <h2>New Job Application</h2>
        <p><strong>Name:</strong> ${order.customerName}</p>
        <p><strong>Phone:</strong> ${order.mobileNumber}</p>
        <p><strong>Email:</strong> ${order.email || 'N/A'}</p>
        <p><strong>Paid:</strong> ₹${(order.amount / 100).toFixed(2)}</p>
        <p><strong>MerchantOrderId:</strong> ${merchantOrderId}</p>
      `
                });

                console.log("EMAIL SUCCESS");

              } catch (emailErr) {

                console.error("EMAIL FAILED:", emailErr);

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