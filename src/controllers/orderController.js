// import { randomUUID } from 'crypto'
// import { StandardCheckoutPayRequest } from 'pg-sdk-node'
// import { env } from '../config/env.js'
// import { Order } from '../models/Order.js'

// export function makeOrderController(client){
//   return {
//     async createOrder(req, res){
//       try{
//         const { amount, customerName, mobileNumber, email, note } = req.body

//         if (!amount) return res.status(400).send('Amount is required')
//         if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
//           return res.status(400).send('Amount must be a positive number in paise')
//         }
//         if (!customerName || typeof customerName !== 'string' || !customerName.trim()) {
//           return res.status(400).send('Customer name is required')
//         }
//         if (!mobileNumber || !/^\d{10}$/.test(mobileNumber)) {
//           return res.status(400).send('Valid 10-digit mobile number is required')
//         }
//         if (email && typeof email === 'string') {
//           const simpleEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
//           if (!simpleEmail.test(email)) return res.status(400).send('Email is invalid')
//         }

//         const merchantOrderId = randomUUID()

//         await Order.create({
//           merchantOrderId,
//           amount,
//           customerName,
//           mobileNumber,
//           email: email || undefined,
//           note: note || undefined,
//           status: 'PENDING',
//         })

//         const redirectUrl = `${env.frontendUrl.replace(/\/$/, '')}/processing` // optional interim page if needed
//         const statusCallback = `http://localhost:${env.port}/check-status?merchantOrderId=${merchantOrderId}`

//         const request = StandardCheckoutPayRequest.builder()
//           .merchantOrderId(merchantOrderId)
//           .amount(amount)
//           .redirectUrl(statusCallback)
//           .build()

//         const response = await client.pay(request)

//         return res.json({ checkoutPageUrl: response.redirectUrl, merchantOrderId })
//       }catch(e){
//         console.error('error creating order', e)
//         return res.status(500).send('Error creating order')
//       }
//     },

//     async checkStatus(req, res){
//       try{
//         const { merchantOrderId } = req.query
//         if(!merchantOrderId) return res.status(400).send('MerchantOrderId is required')

//         const response = await client.getOrderStatus(merchantOrderId)
//         const status = response.state

//         await Order.findOneAndUpdate(
//           { merchantOrderId },
//           { status, updatedAt: new Date() },
//           { new: true }
//         )

//         const successUrl = `${env.frontendUrl.replace(/\/$/, '')}/success?merchantOrderId=${encodeURIComponent(merchantOrderId)}`
//         const failureUrl = `${env.frontendUrl.replace(/\/$/, '')}/failure?merchantOrderId=${encodeURIComponent(merchantOrderId)}`
//         return res.redirect(status === 'COMPLETED' ? successUrl : failureUrl)
//       }catch(e){
//         console.error('error getting status', e)
//         return res.status(500).send('Error getting status')
//       }
//     },

//     async getOrder(req, res){
//       try{
//         const { merchantOrderId } = req.params
//         const order = await Order.findOne({ merchantOrderId })
//         if(!order) return res.status(404).send('Order not found')
//         return res.json(order)
//       }catch(e){
//         return res.status(500).send('Error fetching order')
//       }
//     },

//     async listOrders(req, res){
//       try{
//         const { limit = 100, skip = 0 } = req.query
//         const parsedLimit = Math.min(Number(limit) || 100, 500)
//         const parsedSkip = Number(skip) || 0
//         const [items, total] = await Promise.all([
//           Order.find({}).sort({ createdAt: -1 }).limit(parsedLimit).skip(parsedSkip),
//           Order.countDocuments({})
//         ])
//         return res.json({ total, items })
//       }catch(e){
//         return res.status(500).send('Error listing orders')
//       }
//     },

//     // Webhook to receive async status updates from PhonePe
//     async phonepeWebhook(req, res){
//       try{
//         // Optional: simple shared-secret check via header
//         const signature = req.headers['x-webhook-signature'] || req.headers['x-signature']
//         if (env.webhookSecret) {
//           if (!signature || signature !== env.webhookSecret) {
//             return res.status(401).send('Invalid webhook signature')
//           }
//         }

//         const payload = req.body || {}
//         const merchantOrderId = payload.merchantOrderId || payload.orderId || payload.data?.merchantOrderId
//         const status = payload.state || payload.status || payload.data?.state
//         if(!merchantOrderId){
//           return res.status(400).send('merchantOrderId missing')
//         }

//         const update = { lastWebhook: payload, updatedAt: new Date() }
//         if (status) update.status = status

//         await Order.findOneAndUpdate(
//           { merchantOrderId },
//           update,
//           { upsert: false }
//         )

//         return res.json({ ok: true })
//       }catch(e){
//         console.error('webhook error', e)
//         return res.status(500).send('Webhook handling error')
//       }
//     }
//   }
// }

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
        if (!customerName?.trim()) return res.status(400).send('Customer name required')
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

        // ---------------- PhonePe Request ----------------
        const statusCallback = `http://localhost:${env.port}/check-status?merchantOrderId=${merchantOrderId}`
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
        if (!merchantOrderId) return res.status(400).send('MerchantOrderId required')

        const response = await client.getOrderStatus(merchantOrderId)
        const status = response.state

        const order = await Order.findOneAndUpdate(
          { merchantOrderId },
          { status, updatedAt: new Date(), lastWebhook: response },
          { new: true }
        )

        // ---------------- Create Application after Payment ----------------
        if (status === 'COMPLETED') {
          const existing = await Application.findOne({ merchantOrderId })
          if (!existing) {
            let job = order.jobId ? await Job.findById(order.jobId) : null

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

            // Send Email to Job Owner
            if (job?.postedByEmail) {
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
              })
            }
          }
        }

        // ---------------- Redirect to frontend ----------------
        const successUrl = `${env.frontendUrl}/success?merchantOrderId=${encodeURIComponent(merchantOrderId)}`
        const failureUrl = `${env.frontendUrl}/failure?merchantOrderId=${encodeURIComponent(merchantOrderId)}`

        return res.redirect(status === 'COMPLETED' ? successUrl : failureUrl)
      } catch (e) {
        console.error('Error checking status:', e)
        return res.status(500).send('Error checking status')
      }
    },

    // ============================================================
    // GET SINGLE ORDER
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
    // LIST ALL ORDERS
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
    // PHONEPE WEBHOOK
    // ============================================================
    async phonepeWebhook(req, res) {
      try {
        console.log("Webhook Received:", req.body)
        res.status(200).send("OK")
      } catch (e) {
        console.error("Webhook error:", e)
        res.status(500).send("Error")
      }
    }
  }
}
