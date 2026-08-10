import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import {
  registerWorker,
  getWorkers,
  getWorkerById,
} from "../controllers/workerController.js";

export function createWorkerRouter() {
  const router = express.Router();

  // =========================
  // Upload Directory
  // =========================

  const uploadDir = "uploads";

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {
      recursive: true,
    });
  }

  // =========================
  // Multer Storage
  // =========================

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

  // =========================
  // Multer Upload
  // =========================

  const upload = multer({
    storage,

    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  });

  // =========================
  // Register Worker
  // =========================

  router.post(
    "/workers/register",
    upload.single("kycDocument"),
    registerWorker
  );

  // =========================
  // Get All Workers
  // =========================

  router.get(
    "/workers",
    getWorkers
  );

  // =========================
  // Get Worker By ID
  // =========================

  router.get(
    "/workers/:id",
    getWorkerById
  );

  // =========================
  // Test Worker Route
  // =========================

  router.get("/workers/test", (req, res) => {
    res.json({
      success: true,
      message: "Worker route is working",
    });
  });

  return router;
}