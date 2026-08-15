import express from 'express'
import cors from 'cors'

import { connectDb } from './config/db.js'
import { env, assertEnv } from './config/env.js'
import { createPhonePeClient } from './config/phonepe.js'

import { makeOrderController } from './controllers/orderController.js'

import { createOrderRouter } from './routes/orderRoutes.js'
import { createJobRouter } from './routes/jobRoutes.js'
import { createSitemapRouter } from './routes/sitemap.js'
import webhookRoutes from './routes/webhook.routes.js'
import { createWorkerRouter } from './routes/workerRoutes.js'
import { createNotificationRouter } from './routes/notificationRoutes.js'
import { createLocationRouter } from "./routes/location.routes.js";


export async function createApp() {

  assertEnv()

  await connectDb()

  const app = express()

  app.use(express.json())

  app.use(cors())


  // ===============================
  // PhonePe Order Routes
  // ===============================

  const client = createPhonePeClient()

  const controller = makeOrderController(client)

  app.use(
    '/',
    createOrderRouter(controller)
  )


  // ===============================
  // Webhook Routes
  // ===============================

  app.use(
    '/',
    webhookRoutes
  )


  // ===============================
  // Job Routes
  // ===============================

  app.use(
    '/',
    createJobRouter()
  )


  // ===============================
  // Sitemap
  // ===============================

  app.use(
    '/',
    createSitemapRouter()
  )


  // ===============================
  // Worker Routes
  // ===============================

  app.use(
    '/',
    createWorkerRouter()
  )

app.use("/locations", createLocationRouter());
  // ===============================
  // Notification Routes 🔔
  // ===============================

  app.use(
    '/',
    createNotificationRouter()
  )


  // ===============================
  // Health Check
  // ===============================

  app.get(
    '/health',
    (req, res) => {
      res.json({
        status: 'ok'
      })
    }
  )


  return app
}