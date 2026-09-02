
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
    const cleanKycNumber = kycNumber
      .trim()
      .toUpperCase();

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

      if (
        existingWorker.paymentStatus === "PAID" &&
        existingWorker.status === "Active"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Worker with this mobile number is already registered.",
        });
      }

      // ===============================================
      // PAYMENT NOT COMPLETED
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
          paymentStatus:
            existingWorker.paymentStatus,
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

      // Worker is inactive until payment.
      status: "Pending",

      paymentStatus: "PENDING",

      paymentAmount:
        WORKER_REGISTRATION_AMOUNT,
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
      message: "Unable to fetch workers",
    });
  }
}

// =====================================================
// GET SINGLE WORKER
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
      "Get Worker Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch worker",
    });
  }
}

// =====================================================
// SEND WORKER LOGIN OTP
// =====================================================

export async function sendWorkerLoginOtp(req, res) {
  try {
    const { mobile } = req.body;

    // =================================================
    // VALIDATE MOBILE
    // =================================================

    if (
      !mobile ||
      !/^\d{10}$/.test(mobile.trim())
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid 10 digit mobile number",
      });
    }

    const cleanMobile = mobile.trim();

    // =================================================
    // FIND WORKER
    // =================================================

    const worker = await Worker.findOne({
      mobile: cleanMobile,
    });

    if (!worker) {
      return res.status(404).json({
        success: false,
        message:
          "Worker not found. Please register first.",
      });
    }

    // =================================================
    // PAYMENT CHECK
    // =================================================

    if (
      worker.paymentStatus !== "PAID" ||
      worker.status !== "Active"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your ₹250 registration payment is not completed. Please complete registration payment first.",
      });
    }

    // =================================================
    // FAST2SMS CONFIG
    // =================================================

  const apiKey = process.env.FAST2SMS_API_KEY?.trim();
const otpId = process.env.FAST2SMS_OTP_ID?.trim();

console.log("📱 Fast2SMS Config:", {
apiKeyConfigured: Boolean(apiKey),
otpIdConfigured: Boolean(otpId),
});

if (!apiKey || !otpId) {
console.error(
"❌ Fast2SMS configuration missing. Check FAST2SMS_API_KEY and FAST2SMS_OTP_ID in Render Environment Variables."
);

return res.status(500).json({
success: false,
message: "OTP service is not configured",
});
}


    // =================================================
    // SEND OTP
    // =================================================

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
          mobile: cleanMobile,
        }),
      }
    );

    const result = await response.json();

    console.log(
      "Fast2SMS Send OTP:",
      result
    );

    if (
      !response.ok ||
      !result.return
    ) {
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

    // =================================================
    // VALIDATE MOBILE
    // =================================================

    if (
      !mobile ||
      !/^\d{10}$/.test(mobile.trim())
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid mobile number",
      });
    }

    // =================================================
    // VALIDATE OTP
    // =================================================

    if (
      !otp ||
      !/^\d{4,8}$/.test(
        String(otp).trim()
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid OTP",
      });
    }

    const cleanMobile = mobile.trim();
    const cleanOtp = String(otp).trim();

    // =================================================
    // FIND WORKER
    // =================================================

    const worker = await Worker.findOne({
      mobile: cleanMobile,
    });

    if (!worker) {
      return res.status(404).json({
        success: false,
        message:
          "Worker not found. Please register first.",
      });
    }

    // =================================================
    // PAYMENT CHECK
    // =================================================
    //
    // OTP correct hone ke baad bhi unpaid worker
    // login nahi kar sakta.
    // =================================================

    if (
      worker.paymentStatus !== "PAID" ||
      worker.status !== "Active"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your ₹250 registration payment is not completed. Please complete registration payment first.",
        paymentStatus:
          worker.paymentStatus,
        status: worker.status,
      });
    }

    // =================================================
    // FAST2SMS CONFIG
    // =================================================

    const apiKey =
      process.env.FAST2SMS_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message:
          "OTP service is not configured",
      });
    }

    // =================================================
    // VERIFY OTP
    // =================================================

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
          mobile: cleanMobile,
          otp: cleanOtp,
        }),
      }
    );

    const result = await response.json();

    console.log(
      "Fast2SMS Verify OTP:",
      result
    );

    if (
      !response.ok ||
      !result.return
    ) {
      return res.status(400).json({
        success: false,
        message:
          result.message ||
          "Invalid or expired OTP",
      });
    }

    // =================================================
    // SUCCESS
    // =================================================

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
        paymentStatus:
          worker.paymentStatus,
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

    // =================================================
    // VALIDATE MOBILE
    // =================================================

    if (
      !mobile ||
      !/^\d{10}$/.test(mobile.trim())
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid mobile number",
      });
    }

    const cleanMobile = mobile.trim();

    // =================================================
    // FIND WORKER
    // =================================================

    const worker = await Worker.findOne({
      mobile: cleanMobile,
    });

    if (!worker) {
      return res.status(404).json({
        success: false,
        message:
          "Worker not found",
      });
    }

    // =================================================
    // PAYMENT CHECK
    // =================================================

    if (
      worker.paymentStatus !== "PAID" ||
      worker.status !== "Active"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your ₹250 registration payment is not completed. Please complete registration payment first.",
      });
    }

    // =================================================
    // FAST2SMS CONFIG
    // =================================================

    const apiKey =
      process.env.FAST2SMS_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message:
          "OTP service is not configured",
      });
    }

    // =================================================
    // RESEND OTP
    // =================================================

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
          mobile: cleanMobile,
        }),
      }
    );

    const result = await response.json();

    console.log(
      "Fast2SMS Resend OTP:",
      result
    );

    if (
      !response.ok ||
      !result.return
    ) {
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
