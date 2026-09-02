
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import {
  registerWorker,
  getWorkers,
  getWorkerById,
  sendWorkerLoginOtp,
  verifyWorkerLoginOtp,
  resendWorkerLoginOtp,
} from "../controllers/workerController.js";

import {
  makeWorkerPaymentController,
} from "../controllers/workerPaymentController.js";

import { createPhonePeClient } from "../config/phonepe.js";

export function createWorkerRouter() {
  const router = express.Router();

  // =====================================================
  // PHONEPE
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
  // MULTER
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
      fileSize: 5 * 1024 * 1024,
    },
  });

  // =====================================================
  // WORKER REGISTRATION
  // =====================================================

  router.post(
    "/workers/register",
    upload.single("kycDocument"),
    registerWorker
  );

  // =====================================================
  // WORKER ₹250 REGISTRATION PAYMENT
  // =====================================================

  router.post(
    "/workers/payment/create",
    workerPaymentController.createWorkerPayment
  );

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
  // WORKER LOGIN OTP
  // =====================================================

  router.post(
    "/workers/login/send-otp",
    sendWorkerLoginOtp
  );

  router.post(
    "/workers/login/verify-otp",
    verifyWorkerLoginOtp
  );

  router.post(
    "/workers/login/resend-otp",
    resendWorkerLoginOtp
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

