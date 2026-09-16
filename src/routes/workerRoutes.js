
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import {
  registerWorker,
  getWorkers,
  getWorkerById,
  verifyWorker,
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
  //
  // Registration ke baad:
  // status = Pending
  // paymentStatus = PENDING
  // verificationStatus = Pending
  //
  // Payment complete hone ke baad worker Active hoga.
  // Verification baad mein Admin karega.

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
  // GET WORKER BY MERCHANT ORDER ID
  // =====================================================
  // Payment success ke baad Success.jsx
  // merchantOrderId se workerId recover karega.

  router.get(
    "/workers/payment-by-order/:merchantOrderId",
    workerPaymentController.getWorkerByMerchantOrderId
  );

  // =====================================================
  // GET ALL WORKERS
  // =====================================================

  router.get(
    "/workers",
    getWorkers
  );

  // =====================================================
  // ADMIN - WORKER VERIFICATION
  // =====================================================
  //
  // Payment aur verification alag processes hain.
  //
  // Worker payment complete kar sakta hai bina
  // verification ke.
  //
  // Admin baad mein worker ko verify karega.
  //
  // PATCH:
  // /admin/workers/:id/verification
  //
  // Example body:
  //
  // {
  //   "verificationStatus": "Verified",
  //   "skillLevel": "Expert",
  //   "verificationScore": 88,
  //   "experienceYears": 8,
  //   "kycVerified": true,
  //   "skillVerified": true,
  //   "adminNotes": "KYC and skill verified."
  // }

  router.patch(
    "/admin/workers/:id/verification",
    verifyWorker
  );

  // =====================================================
  // GET SINGLE WORKER
  // =====================================================

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

