
import mongoose from "mongoose";

const workerPaymentSchema = new mongoose.Schema(
  {
    merchantOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      default: 50,
    },

    mobileNumber: {
      type: String,
      required: true,
    },

    customerName: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      default: "PENDING",
      index: true,
    },

    transactionId: {
      type: String,
      default: null,
    },

    lastWebhook: {
      type: Object,
    },

    paidAt: {
      type: Date,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export const WorkerPayment = mongoose.model(
  "WorkerPayment",
  workerPaymentSchema
);

