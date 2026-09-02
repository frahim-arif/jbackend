import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import {
  registerWorker,
  getWorkers,
  getWorkerById,
} from "../controllers/workerController.js";

import {
  makeWorkerPaymentController,
} from "../controllers/workerPaymentController.js";

import { createPhonePeClient } from "../config/phonepe.js";

export function createWorkerRouter() {
  const router = express.Router();

  // =====================================================
  // PHONEPE CLIENT
  // =====================================================

  const phonepeClient = createPhonePeClient();

  const workerPaymentController =
    makeWorkerPaymentController(phonepeClient);

  // =====================================================
  // UPLOAD DIRECTORY
  // =====================================================

  const uploadDir = "uploads";

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {
      recursive: true,
    });
  }

  // =====================================================
  // MULTER CONFIGURATION
  // =====================================================

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
      const uniqueName =
        Date.now() +
        "-" +
        Math.round(Math.random() * 1e9) +
        path.extname(file.originalname);

      cb(null, uniqueName);
    },
  });

  const upload = multer({
    storage,

    limits: {
      fileSize: 5 * 1024 * 1024, // 5 MB
    },
  });

  // =====================================================
  // WORKER REGISTRATION
  // =====================================================
  // Worker register karega.
  // Registration ke baad worker Pending rahega.
  // Payment complete hone ke baad Active hoga.

  router.post(
    "/workers/register",
    upload.single("kycDocument"),
    registerWorker
  );

  // =====================================================
  // WORKER ₹250 REGISTRATION PAYMENT
  // =====================================================
  // One-time registration payment

  router.post(
    "/workers/payment/create",
    workerPaymentController.createWorkerPayment
  );

  // =====================================================
  // PHONEPE PAYMENT STATUS
  // =====================================================

  router.get(
    "/worker-payment/check-status",
    workerPaymentController.checkWorkerPaymentStatus
  );

  // =====================================================
  // WORKERS
  // =====================================================

  router.get(
    "/workers",
    getWorkers
  );

  router.get(
    "/workers/:id",
    getWorkerById
  );

  // =====================================================
  // TEST ROUTE
  // =====================================================

  router.get(
    "/workers/test",
    (req, res) => {
      return res.json({
        success: true,
        message: "Worker route is working",
      });
    }
  );

  return router;
}