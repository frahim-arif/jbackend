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

    // =========================
    // Required Fields
    // =========================

    if (
      !name ||
      !mobile ||
      !state ||
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
        message:
          "Please enter a valid 10 digit mobile number",
      });
    }

    // =========================
    // KYC Validation
    // =========================

    if (!["Aadhaar", "PAN"].includes(kycType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid KYC document type",
      });
    }

    // =========================
    // Aadhaar Validation
    // =========================

    if (
      kycType === "Aadhaar" &&
      !/^\d{12}$/.test(kycNumber)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid 12 digit Aadhaar number",
      });
    }

    // =========================
    // PAN Validation
    // =========================

    if (
      kycType === "PAN" &&
      !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(
        kycNumber.toUpperCase()
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid PAN number",
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
        message:
          "Worker with this mobile number already exists",
      });
    }

    // =========================
    // Uploaded KYC Document
    // =========================

    const kycDocument = req.file
      ? `/uploads/${req.file.filename}`
      : null;

    // =========================
    // KYC Document Required
    // =========================

    if (!kycDocument) {
      return res.status(400).json({
        success: false,
        message:
          "Please upload your KYC document",
      });
    }

    // =========================
    // CREATE WORKER
    // =========================

    const worker = await Worker.create({
      name: name.trim(),

      mobile: mobile.trim(),

      // India-wide location
      state: state.trim(),

      district: district.trim(),

      workType: workType.trim(),

      kycType: kycType.trim(),

      kycNumber:
        kycNumber.trim().toUpperCase(),

      kycDocument,

      status: "Pending",
    });

    // =========================
    // SUCCESS
    // =========================

    return res.status(201).json({
      success: true,

      message:
        "Worker registered successfully",

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
};


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
};


// =====================================================
// GET SINGLE WORKER
// =====================================================

export async function getWorkerById(req, res) {
  try {
    const worker =
      await Worker.findById(
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

// =====================================================
// SEND WORKER LOGIN OTP
// =====================================================

export async function sendWorkerLoginOtp(req, res) {
  try {
    const { mobile } = req.body;

    // -------------------------
    // Validate mobile
    // -------------------------

    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid 10 digit mobile number",
      });
    }

    // -------------------------
    // Find worker
    // -------------------------

    const worker = await Worker.findOne({
      mobile: mobile.trim(),
    });

    if (!worker) {
      return res.status(404).json({
        success: false,
        message:
          "Worker not found. Please register first.",
      });
    }

    // -------------------------
    // Fast2SMS API Key
    // -------------------------

    const apiKey =
      process.env.FAST2SMS_API_KEY;

    const otpId =
      process.env.FAST2SMS_OTP_ID;

    if (!apiKey || !otpId) {
      console.error(
        "FAST2SMS_API_KEY or FAST2SMS_OTP_ID missing"
      );

      return res.status(500).json({
        success: false,
        message:
          "OTP service is not configured",
      });
    }

    // -------------------------
    // Send OTP
    // -------------------------

    const response = await fetch(
      "https://www.fast2sms.com/dev/otp/send",
      {
        method: "POST",

        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },

        body: JSON.stringify({
          otp_id: otpId,
          mobile: mobile.trim(),
        }),
      }
    );

    const result = await response.json();

    console.log(
      "Fast2SMS Send OTP:",
      result
    );

    if (!response.ok || !result.return) {
      return res.status(400).json({
        success: false,
        message:
          result.message ||
          "Unable to send OTP",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "OTP sent successfully",
    });

  } catch (error) {
    console.error(
      "Send Worker OTP Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to send OTP",
    });
  }
}


// =====================================================
// VERIFY WORKER LOGIN OTP
// =====================================================

export async function verifyWorkerLoginOtp(
  req,
  res
) {
  try {
    const {
      mobile,
      otp,
    } = req.body;

    // -------------------------
    // Validate
    // -------------------------

    if (
      !mobile ||
      !/^\d{10}$/.test(mobile)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid mobile number",
      });
    }

    if (
      !otp ||
      !/^\d{4,8}$/.test(otp)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid OTP",
      });
    }

    // -------------------------
    // Find worker
    // -------------------------

    const worker = await Worker.findOne({
      mobile: mobile.trim(),
    });

    if (!worker) {
      return res.status(404).json({
        success: false,
        message:
          "Worker not found. Please register first.",
      });
    }

    // -------------------------
    // Fast2SMS
    // -------------------------

    const apiKey =
      process.env.FAST2SMS_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message:
          "OTP service is not configured",
      });
    }

    // -------------------------
    // Verify OTP
    // -------------------------

    const response = await fetch(
      "https://www.fast2sms.com/dev/otp/verify",
      {
        method: "POST",

        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },

        body: JSON.stringify({
          mobile: mobile.trim(),
          otp: otp.trim(),
        }),
      }
    );

    const result = await response.json();

    console.log(
      "Fast2SMS Verify OTP:",
      result
    );

    if (!response.ok || !result.return) {
      return res.status(400).json({
        success: false,
        message:
          result.message ||
          "Invalid or expired OTP",
      });
    }

    // -------------------------
    // SUCCESS
    // -------------------------

    return res.status(200).json({
      success: true,

      message:
        "Login successful",

      worker: {
        _id: worker._id,
        name: worker.name,
        mobile: worker.mobile,
        state: worker.state,
        district: worker.district,
        workType: worker.workType,
        status: worker.status,
      },
    });

  } catch (error) {
    console.error(
      "Verify Worker OTP Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify OTP",
    });
  }
}


// =====================================================
// RESEND WORKER OTP
// =====================================================

export async function resendWorkerLoginOtp(
  req,
  res
) {
  try {
    const { mobile } = req.body;

    if (
      !mobile ||
      !/^\d{10}$/.test(mobile)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid mobile number",
      });
    }

    const worker = await Worker.findOne({
      mobile: mobile.trim(),
    });

    if (!worker) {
      return res.status(404).json({
        success: false,
        message:
          "Worker not found",
      });
    }

    const apiKey =
      process.env.FAST2SMS_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message:
          "OTP service is not configured",
      });
    }

    const response = await fetch(
      "https://www.fast2sms.com/dev/otp/resend",
      {
        method: "POST",

        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },

        body: JSON.stringify({
          mobile: mobile.trim(),
        }),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.return) {
      return res.status(400).json({
        success: false,
        message:
          result.message ||
          "Unable to resend OTP",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "OTP resent successfully",
    });

  } catch (error) {
    console.error(
      "Resend OTP Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to resend OTP",
    });
  }
}