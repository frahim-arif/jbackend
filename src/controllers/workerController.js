
import { Worker } from "../models/Worker.js";

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
    // MOBILE VALIDATION
    // =====================================================

    const cleanMobile = mobile.trim();

    if (!/^\d{10}$/.test(cleanMobile)) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid 10 digit mobile number",
      });
    }

    // =====================================================
    // KYC VALIDATION
    // =====================================================

    const cleanKycType = kycType.trim();
    const cleanKycNumber = kycNumber
      .trim()
      .toUpperCase();

    if (!["Aadhaar", "PAN"].includes(cleanKycType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid KYC document type",
      });
    }

    // Aadhaar
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

    // PAN
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

    const existingWorker = await Worker.findOne({
      mobile: cleanMobile,
    });

    if (existingWorker) {
      // -----------------------------------------------
      // Already Paid
      // -----------------------------------------------

      if (
        existingWorker.paymentStatus === "PAID"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Worker with this mobile number is already registered.",
        });
      }

      // -----------------------------------------------
      // Registration Started But Payment Pending
      // -----------------------------------------------

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
      name: name.trim(),
      mobile: cleanMobile,

      state: state.trim(),
      district: district.trim(),
      workType: workType.trim(),

      kycType: cleanKycType,
      kycNumber: cleanKycNumber,
      kycDocument,

      // -----------------------------------------------
      // IMPORTANT:
      // Worker is NOT active before payment
      // -----------------------------------------------

      status: "Pending",
      paymentStatus: "PENDING",

      // ₹250 = 25000 paise
      paymentAmount: 25000,
    });

    // =====================================================
    // SUCCESS
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
      error: error.message,
    });
  }
}

