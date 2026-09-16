import mongoose from "mongoose";

const workerSchema = new mongoose.Schema(
  {
    // =====================================================
    // BASIC WORKER INFORMATION
    // =====================================================

    name: {
      type: String,
      trim: true,
      default: "",
    },

    mobile: {
      type: String,
      trim: true,
      index: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      index: true,
    },

    state: {
      type: String,
      trim: true,
      default: "",
    },

    district: {
      type: String,
      trim: true,
      default: "",
    },

    workType: {
      type: String,
      trim: true,
      default: "",
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
    // Account status is separate from verification.

    status: {
      type: String,
      enum: ["Pending", "Active", "Blocked"],
      default: "Pending",
      index: true,
    },

    // =====================================================
    // WORKER VERIFICATION
    // =====================================================

    verificationStatus: {
      type: String,
      enum: [
        "Pending",
        "Under Review",
        "Verified",
        "Need More Information",
        "Rejected",
      ],
      default: "Pending",
      index: true,
    },

    // =====================================================
    // SKILL LEVEL
    // =====================================================
    // null = Not Assessed yet

    skillLevel: {
      type: String,
      enum: [
        "Expert",
        "Skilled",
        "Semi-Skilled",
        "Helper",
      ],
      default: null,
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

    adminNotes: {
      type: String,
      trim: true,
      default: "",
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    verifiedBy: {
      type: String,
      trim: true,
      default: "",
    },

    // =====================================================
    // PAYMENT
    // =====================================================

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
      index: true,
    },

    paymentAmount: {
      type: Number,
      default: 25000,
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