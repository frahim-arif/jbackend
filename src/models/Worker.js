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
    },

    // =====================================================
    // WORKER LOCATION
    // =====================================================

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

    status: {
      type: String,
      default: "Pending",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

export const Worker =
  mongoose.model("Worker", workerSchema);