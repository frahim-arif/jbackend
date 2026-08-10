
const Worker = require("../models/worker.model");


// ===============================
// Register Worker
// ===============================
const registerWorker = async (req, res) => {
  try {
    const {
      name,
      mobile,
      district,
      workType,
      kycType,
      kycNumber,
    } = req.body;

    // Required fields check
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
        message: "All required fields are required",
      });
    }

    // Check duplicate mobile
    const existingWorker = await Worker.findOne({ mobile });

    if (existingWorker) {
      return res.status(409).json({
        success: false,
        message: "Worker with this mobile number already exists",
      });
    }

    // File path
    const kycDocument = req.file
      ? `/uploads/${req.file.filename}`
      : null;

    // Create worker
    const worker = await Worker.create({
      name,
      mobile,
      district,
      workType,
      kycType,
      kycNumber,
      kycDocument,
    });

    return res.status(201).json({
      success: true,
      message: "Worker registered successfully",
      worker,
    });
  } catch (error) {
    console.error("Worker Registration Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


// ===============================
// Get All Workers
// ===============================
const getWorkers = async (req, res) => {
  try {
    const workers = await Worker.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      workers,
    });
  } catch (error) {
    console.error("Get Workers Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


// ===============================
// Get Single Worker
// ===============================
const getWorkerById = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);

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
    console.error("Get Worker Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


module.exports = {
  registerWorker,
  getWorkers,
  getWorkerById,
};

