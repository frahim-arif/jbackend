import { Worker } from "../models/Worker.js";

// =====================================================
// REGISTER WORKER
// =====================================================

export async function registerWorker(req, res) {
  try {
    const {
      name,
      mobile,
      district,
      workType,
      kycType,
      kycNumber,
    } = req.body;

    // =========================
    // Required Fields
    // =========================

    if (
      !name ||
      !mobile ||
      !district ||
      !workType ||
      !kycType ||
      !kycNumber
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // =========================
    // Mobile Validation
    // =========================

    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10 digit mobile number",
      });
    }

    // =========================
    // Check Existing Worker
    // =========================

    const existingWorker = await Worker.findOne({
      mobile,
    });

    if (existingWorker) {
      return res.status(409).json({
        success: false,
        message: "Worker with this mobile number already exists",
      });
    }

    // =========================
    // Uploaded KYC Document
    // =========================

    const kycDocument = req.file
      ? `/uploads/${req.file.filename}`
      : null;

    // =========================
    // Create Worker
    // =========================

    const worker = await Worker.create({
      name: name.trim(),
      mobile,
      district,
      workType,
      kycType,
      kycNumber,
      kycDocument,
    });

    // =========================
    // Success Response
    // =========================

    return res.status(201).json({
      success: true,
      message: "Worker registered successfully",
      worker,
    });

  } catch (error) {

    console.error(
      "Worker Registration Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}


// =====================================================
// GET ALL WORKERS
// =====================================================

export async function getWorkers(req, res) {
  try {

    const workers = await Worker
      .find()
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: workers.length,
      workers,
    });

  } catch (error) {

    console.error(
      "Get Workers Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}


// =====================================================
// GET SINGLE WORKER
// =====================================================

export async function getWorkerById(req, res) {
  try {

    const worker = await Worker.findById(
      req.params.id
    );

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found",
      });
    }

    return res.status(200).json({
      success: true,
      worker,
    });

  } catch (error) {

    console.error(
      "Get Worker Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
}