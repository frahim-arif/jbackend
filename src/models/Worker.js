import mongoose from "mongoose";

const workerSchema = new mongoose.Schema(
  {
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

    kycType: String,

    kycNumber: String,

    kycDocument: String,

    // =====================================================
    // WORKER STATUS
    // =====================================================

    status: {
      type: String,
      enum: ["Pending", "Active", "Blocked"],
      default: "Pending",
    },

    // =====================================================
    // PAYMENT
    // =====================================================

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