import mongoose from "mongoose";

const clientPaymentSchema = new mongoose.Schema(
  {
    // =====================================================
    // JOB
    // =====================================================

    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },

    jobTitle: {
      type: String,
      trim: true,
      default: "",
    },

    // =====================================================
    // WORKER
    // =====================================================

    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
      default: null,
      index: true,
    },

    workerName: {
      type: String,
      trim: true,
      default: "",
    },

    // =====================================================
    // CLIENT
    // =====================================================

    clientName: {
      type: String,
      trim: true,
      default: "",
    },

    clientPhone: {
      type: String,
      trim: true,
      default: "",
    },

    clientEmail: {
      type: String,
      trim: true,
      default: "",
    },

    // =====================================================
    // PAYMENT
    // =====================================================

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["QR"],
      default: "QR",
      index: true,
    },

    utrNumber: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    // =====================================================
    // PAYMENT STATUS
    // =====================================================

    paymentStatus: {
      type: String,
      enum: ["PENDING", "VERIFIED", "REJECTED"],
      default: "PENDING",
      index: true,
    },

    // =====================================================
    // JOBHIR COMMISSION
    // =====================================================

    commissionRate: {
      type: Number,
      default: 10,
    },

    commissionAmount: {
      type: Number,
      default: 0,
    },

    // =====================================================
    // WORKER SHARE
    // =====================================================

    workerAmount: {
      type: Number,
      default: 0,
    },

    // =====================================================
    // WORKER PAYOUT
    // =====================================================

    workerPayoutStatus: {
      type: String,
      enum: ["PENDING", "PAID"],
      default: "PENDING",
      index: true,
    },

    workerPaidAt: {
      type: Date,
      default: null,
    },

    // =====================================================
    // ADMIN VERIFICATION
    // =====================================================

    verifiedAt: {
      type: Date,
      default: null,
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    // =====================================================
    // TIMESTAMPS
    // =====================================================

    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    versionKey: false,
  }
);

export const ClientPayment = mongoose.model(
  "ClientPayment",
  clientPaymentSchema
);