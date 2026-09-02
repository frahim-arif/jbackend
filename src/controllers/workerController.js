
import { Worker } from "../models/Worker.js";

// =====================================================
// WORKER REGISTRATION PAYMENT
// =====================================================

const WORKER_REGISTRATION_AMOUNT = 25000; // ₹250 in paise;

// =====================================================
// REGISTER WORKER
// =====================================================

export async function registerWorker(req, res) {
  try {
    const {
      name,
      mobile,
      state,
      district,
      workType,
      kycType,
      kycNumber,
    } = req.body;

    // =====================================================
    // REQUIRED FIELDS
    // =====================================================

    if (
      !name?.trim() ||
      !mobile?.trim() ||
      !state?.trim() ||
      !district?.trim() ||
      !workType?.trim() ||
      !kycType?.trim() ||
      !kycNumber?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // =====================================================
    // CLEAN DATA
    // =====================================================

    const cleanName = name.trim();
    const cleanMobile = mobile.trim();
    const cleanState = state.trim();
    const cleanDistrict = district.trim();
    const cleanWorkType = workType.trim();
    const cleanKycType = kycType.trim();
    const cleanKycNumber = kycNumber
      .trim()
      .toUpperCase();

    // =====================================================
    // MOBILE VALIDATION
    // =====================================================

    if (!/^\d{10}$/.test(cleanMobile)) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid 10 digit mobile number",
      });
    }

    // =====================================================
    // KYC TYPE VALIDATION
    // =====================================================

    if (
      !["Aadhaar", "PAN"].includes(
        cleanKycType
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid KYC document type",
      });
    }

    // =====================================================
    // AADHAAR VALIDATION
    // =====================================================

    if (
      cleanKycType === "Aadhaar" &&
      !/^\d{12}$/.test(cleanKycNumber)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid 12 digit Aadhaar number",
      });
    }

    // =====================================================
    // PAN VALIDATION
    // =====================================================

    if (
      cleanKycType === "PAN" &&
      !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(
        cleanKycNumber
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid PAN number",
      });
    }

    // =====================================================
    // CHECK EXISTING WORKER
    // =====================================================

    const existingWorker =
      await Worker.findOne({
        mobile: cleanMobile,
      });

    if (existingWorker) {
      // =================================================
      // ALREADY PAID
      // =================================================

      if (
        existingWorker.paymentStatus ===
        "PAID"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Worker with this mobile number is already registered.",
        });
      }

      // =================================================
      // PAYMENT STILL PENDING / FAILED
      // =================================================

      return res.status(409).json({
        success: false,

        message:
          "Registration already started. Please complete your ₹250 payment.",

        workerId: existingWorker._id,

        worker: {
          _id: existingWorker._id,
          name: existingWorker.name,
          mobile: existingWorker.mobile,
          state: existingWorker.state,
          district: existingWorker.district,
          workType: existingWorker.workType,
          status: existingWorker.status,
          paymentStatus:
            existingWorker.paymentStatus,
        },
      });
    }

    // =====================================================
    // KYC DOCUMENT
    // =====================================================

    const kycDocument = req.file
      ? `/uploads/${req.file.filename}`
      : null;

    if (!kycDocument) {
      return res.status(400).json({
        success: false,
        message:
          "Please upload your KYC document",
      });
    }

    // =====================================================
    // CREATE PENDING WORKER
    // =====================================================

    const worker = await Worker.create({
      name: cleanName,

      mobile: cleanMobile,

      state: cleanState,

      district: cleanDistrict,

      workType: cleanWorkType,

      kycType: cleanKycType,

      kycNumber: cleanKycNumber,

      kycDocument,

      // IMPORTANT:
      // Worker is inactive until ₹250 is paid.

      status: "Pending",

      paymentStatus: "PENDING",

      paymentAmount:
        WORKER_REGISTRATION_AMOUNT,
    });

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(201).json({
      success: true,

      message:
        "Registration details saved. Please complete ₹250 payment.",

      workerId: worker._id,

      worker: {
        _id: worker._id,

        name: worker.name,

        mobile: worker.mobile,

        state: worker.state,

        district: worker.district,

        workType: worker.workType,

        status: worker.status,

        paymentStatus:
          worker.paymentStatus,
      },
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

export async function getWorkers(
  req,
  res
) {
  try {
    const workers =
      await Worker.find()
        .sort({
          createdAt: -1,
        })
        .select("-kycNumber");

    return res.status(200).json({
      success: true,
      workers,
    });
  } catch (error) {
    console.error(
      "Get Workers Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch workers",
    });
  }
}

// =====================================================
// GET WORKER BY ID
// =====================================================

export async function getWorkerById(
  req,
  res
) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Worker ID required",
      });
    }

    const worker =
      await Worker.findById(id).select(
        "-kycNumber"
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
      "Get Worker By ID Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch worker",
    });
  }
}

// =====================================================
// WORKER LOGIN OTP
// =====================================================
//
// IMPORTANT:
// Apne existing OTP implementation ko yahan rakho.
// In functions ko bina tumhara original OTP code dekhe
// invent karna safe nahi hai.
//
// =====================================================

export async function sendWorkerLoginOtp(
  req,
  res
) {
  return res.status(501).json({
    success: false,
    message:
      "Worker login OTP implementation is required.",
  });
}

export async function verifyWorkerLoginOtp(
  req,
  res
) {
  return res.status(501).json({
    success: false,
    message:
      "Worker login OTP implementation is required.",
  });
}

export async function resendWorkerLoginOtp(
  req,
  res
) {
  return res.status(501).json({
    success: false,
    message:
      "Worker login OTP implementation is required.",
  });
}

