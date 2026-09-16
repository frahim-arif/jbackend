
import mongoose from "mongoose";

const workerSchema = new mongoose.Schema(
  {
    // =====================================================
    // BASIC WORKER INFORMATION
    // =====================================================

    name: {
      type: String,
      trim: true,
    },

    mobile: {
      type: String,
      trim: true,
      index: true,
    },

    state: {
      type: String,
      trim: true,
    },

    district: {
      type: String,
      trim: true,
    },

    workType: {
      type: String,
      trim: true,
    },

    // =====================================================
    // KYC INFORMATION
    // =====================================================

    kycType: {
      type: String,
      trim: true,
    },

    kycNumber: {
      type: String,
      trim: true,
    },

    kycDocument: {
      type: String,
      trim: true,
    },

    // =====================================================
    // WORKER ACCOUNT STATUS
    // =====================================================
    // This controls the worker account itself.
    // It is separate from verification.

    status: {
      type: String,
      enum: ["Pending", "Active", "Blocked"],
      default: "Pending",
    },

    // =====================================================
    // WORKER VERIFICATION
    // =====================================================
    // Payment does NOT automatically make worker verified.
    // Admin will verify the worker later.

    verificationStatus: {
      type: String,
      enum: [
        "Pending",
        "Under Review",
        "Verified",
        "Rejected",
        "Need More Information",
      ],
      default: "Pending",
    },

    // =====================================================
    // SKILL LEVEL
    // =====================================================
    // Admin assigns this after checking the worker.

    skillLevel: {
      type: String,
      enum: [
        "Expert",
        "Skilled",
        "Semi-Skilled",
        "Helper",
      ],
      default: "Helper",
    },

    // =====================================================
    // EXPERIENCE
    // =====================================================

    experienceYears: {
      type: Number,
      min: 0,
      default: 0,
    },

    // =====================================================
    // VERIFICATION SCORE
    // =====================================================
    // Admin can give a score from 0 to 100.

    verificationScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // =====================================================
    // VERIFICATION CHECKS
    // =====================================================

    kycVerified: {
      type: Boolean,
      default: false,
    },

    skillVerified: {
      type: Boolean,
      default: false,
    },

    // =====================================================
    // ADMIN VERIFICATION INFORMATION
    // =====================================================

    verifiedAt: {
      type: Date,
    },

    verifiedBy: {
      type: String,
      trim: true,
    },

    adminNotes: {
      type: String,
      trim: true,
    },

    // =====================================================
    // PAYMENT
    // =====================================================
    // Registration/payment is independent from verification.

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
    },

    paymentAmount: {
      type: Number,
      default: 25000, // ₹250 in paise
    },

    merchantOrderId: {
      type: String,
      index: true,
      sparse: true,
    },

    paidAt: {
      type: Date,
    },

    // =====================================================
    // DATES
    // =====================================================

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export const Worker = mongoose.model(
  "Worker",
  workerSchema
);

