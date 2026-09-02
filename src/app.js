
import express from "express";
import cors from "cors";

import { connectDb } from "./config/db.js";
import { env, assertEnv } from "./config/env.js";

import { createPhonePeClient } from "./config/phonepe.js";
import { makeOrderController } from "./controllers/orderController.js";

import { createOrderRouter } from "./routes/orderRoutes.js";
import { createJobRouter } from "./routes/jobRoutes.js";
import { createSitemapRouter } from "./routes/sitemap.js";
import webhookRoutes from "./routes/webhook.routes.js";

import { createWorkerRouter } from "./routes/workerRoutes.js";
import { createNotificationRouter } from "./routes/notificationRoutes.js";
import { createLocationRouter } from "./routes/location.routes.js";

export async function createApp() {
  // =====================================================
  // ENVIRONMENT
  // =====================================================

  assertEnv();

  // =====================================================
  // DATABASE
  // =====================================================

  await connectDb();

  // =====================================================
  // EXPRESS APP
  // =====================================================

  const app = express();

  // =====================================================
  // MIDDLEWARE
  // =====================================================

  app.use(express.json());

  app.use(
    cors()
  );

  // =====================================================
  // PHONEPE - JOB APPLICATION PAYMENT
  // =====================================================

  const client =
    createPhonePeClient();

  const controller =
    makeOrderController(
      client
    );

  app.use(
    "/",
    createOrderRouter(
      controller
    )
  );

  // =====================================================
  // WEBHOOK ROUTES
  // =====================================================

  app.use(
    "/",
    webhookRoutes
  );

  // =====================================================
  // JOB ROUTES
  // =====================================================

  app.use(
    "/",
    createJobRouter()
  );

  // =====================================================
  // SITEMAP
  // =====================================================

  app.use(
    "/",
    createSitemapRouter()
  );

  // =====================================================
  // WORKER ROUTES
  // =====================================================
  //
  // Worker registration
  // Worker login
  // Worker ₹250 payment
  // Worker payment status
  //
  // createWorkerRouter() ke andar
  // PhonePe client already create ho raha hai.
  //
  // =====================================================

  app.use(
    "/",
    createWorkerRouter()
  );

  // =====================================================
  // LOCATION ROUTES
  // =====================================================

  app.use(
    "/locations",
    createLocationRouter()
  );

  // =====================================================
  // NOTIFICATION ROUTES
  // =====================================================

  app.use(
    "/",
    createNotificationRouter()
  );

  // =====================================================
  // HEALTH CHECK
  // =====================================================

  app.get(
    "/health",
    (req, res) => {
      res.json({
        status: "ok",
      });
    }
  );

  return app;
}

