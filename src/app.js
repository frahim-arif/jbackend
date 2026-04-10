import express from 'express'
import cors from 'cors'
import { connectDb } from './config/db.js'
import { env, assertEnv } from './config/env.js'
import { createPhonePeClient } from './config/phonepe.js'
import { makeOrderController } from './controllers/orderController.js'
import { createOrderRouter } from './routes/orderRoutes.js'
import { createJobRouter } from './routes/jobRoutes.js'
import { createSitemapRouter } from './routes/sitemap.js';

export async function createApp() {
  assertEnv()
  await connectDb()

  const app = express()
  app.use(express.json())
  app.use(cors())

  // PhonePe Order Routes
  const client = createPhonePeClient()
  const controller = makeOrderController(client)
  app.use('/', createOrderRouter(controller))

  // Job Routes (GET, POST, DELETE)
  app.use('/', createJobRouter())
  app.use('/', createSitemapRouter());

  // Health check
  app.get('/health', (req, res) => res.json({ status: 'ok' }))

  return app
}
