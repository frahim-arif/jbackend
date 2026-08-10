
const mongoose = require("mongoose");

const workerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
    },

    district: {
      type: String,
      required: true,
      trim: true,
    },

    workType: {
      type: String,
      required: true,
      trim: true,
    },

    kycType: {
      type: String,
      required: true,
      enum: ["Aadhaar", "PAN"],
    },

    kycNumber: {
      type: String,
      required: true,
      trim: true,
    },

    kycDocument: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Worker", workerSchema);

