
import { Worker } from "../models/Worker.js";

// =====================================================
// WORKER REGISTRATION PAYMENT
// =====================================================

const WORKER_REGISTRATION_AMOUNT = 25000; // ₹250 in paise

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

    // =================================================
    // REQUIRED FIELDS
    // =================================================

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

    // =================================================
    // CLEAN DATA
    // =================================================

    const cleanName = name.trim();
    const cleanMobile = mobile.trim();
    const cleanState = state.trim();
    const cleanDistrict = district.trim();
    const cleanWorkType = workType.trim();
    const cleanKycType = kycType.trim();
    const cleanKycNumber = kycNumber.trim().toUpperCase();

    // =================================================
    // MOBILE VALIDATION
    // =================================================

    if (!/^\d{10}$/.test(cleanMobile)) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid 10 digit mobile number",
      });
    }

    // =================================================
    // KYC TYPE VALIDATION
    // =================================================

    if (!["Aadhaar", "PAN"].includes(cleanKycType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid KYC document type",
      });
    }

    // =================================================
    // AADHAAR VALIDATION
    // =================================================

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

    // =================================================
    // PAN VALIDATION
    // =================================================

    if (
      cleanKycType === "PAN" &&
      !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(cleanKycNumber)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid PAN number",
      });
    }

    // =================================================
    // CHECK EXISTING WORKER
    // =================================================

    const existingWorker = await Worker.findOne({
      mobile: cleanMobile,
    });

    if (existingWorker) {
      // ===============================================
      // ALREADY PAID
      // ===============================================

      if (existingWorker.paymentStatus === "PAID") {
        return res.status(409).json({
          success: false,
          message:
            "Worker with this mobile number is already registered.",
        });
      }

      // ===============================================
      // PAYMENT PENDING / FAILED
      // ===============================================

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
          paymentStatus: existingWorker.paymentStatus,
        },
      });
    }

    // =================================================
    // KYC DOCUMENT
    // =================================================

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

    // =================================================
    // CREATE PENDING WORKER
    // =================================================

    const worker = await Worker.create({
      name: cleanName,
      mobile: cleanMobile,
      state: cleanState,
      district: cleanDistrict,
      workType: cleanWorkType,
      kycType: cleanKycType,
      kycNumber: cleanKycNumber,
      kycDocument,

      // Worker remains inactive until payment.
      status: "Pending",
      paymentStatus: "PENDING",
      paymentAmount: WORKER_REGISTRATION_AMOUNT,
    });

    // =================================================
    // RESPONSE
    // =================================================

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
        paymentStatus: worker.paymentStatus,
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
    });
  }
}

// =====================================================
// GET ALL WORKERS
// =====================================================

export async function getWorkers(req, res) {
  try {
    const workers = await Worker.find()
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

export async function getWorkerById(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Worker ID required",
      });
    }

    const worker = await Worker.findById(id).select(
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
// Yahan tumhara existing OTP implementation
// use karna hai.
//
// sendWorkerLoginOtp
// verifyWorkerLoginOtp
// resendWorkerLoginOtp
//
// In functions ko placeholder 501 par mat rakho
// agar WorkerLogin page use karna hai.
// =====================================================


// =====================================================
// SEND LOGIN OTP
// =====================================================

export async function sendWorkerLoginOtp(req, res) {
  /*
    APNA EXISTING OTP CODE YAHAN RAKHO.

    Important:
    OTP bhejne se pehle worker ko check karna:

      const worker = await Worker.findOne({
        mobile: mobile.trim(),
      });

    Aur sirf registered worker ko OTP bhejna.

    Worker payment check verify ke waqt bhi
    zaroor karna hai.
  */

  return res.status(501).json({
    success: false,
    message:
      "Existing OTP implementation required.",
  });
}


// =====================================================
// VERIFY LOGIN OTP
// =====================================================

export async function verifyWorkerLoginOtp(req, res) {
  /*
    APNA EXISTING OTP VERIFICATION CODE YAHAN RAKHO.

    OTP successfully verify hone ke baad:

      const worker = await Worker.findOne({
        mobile: cleanMobile,
      });

    Phir IMPORTANT:

      if (
        worker.paymentStatus !== "PAID" ||
        worker.status !== "Active"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your ₹250 registration payment is not completed.",
        });
      }

    Aur successful response:

      return res.json({
        success: true,
        message: "Login successful",
        worker: {
          _id: worker._id,
          name: worker.name,
          mobile: worker.mobile,
          state: worker.state,
          district: worker.district,
          workType: worker.workType,
          status: worker.status,
          paymentStatus: worker.paymentStatus,
        },
      });
  */

  return res.status(501).json({
    success: false,
    message:
      "Existing OTP implementation required.",
  });
}


// =====================================================
// RESEND LOGIN OTP
// =====================================================

export async function resendWorkerLoginOtp(req, res) {
  /*
    APNA EXISTING RESEND OTP CODE YAHAN RAKHO.

    Resend se pehle worker existence check karo.

    Payment check resend ke waqt optional hai,
    lekin VERIFY ke waqt payment check mandatory hai.
  */

  return res.status(501).json({
    success: false,
    message:
      "Existing OTP implementation required.",
  });
}

