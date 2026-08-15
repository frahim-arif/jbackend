import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
    },

    company: {
      type: String,
      trim: true,
      default: "",
    },

    description: {
      type: String,
      trim: true,
    },

    postedByEmail: {
      type: String,
      trim: true,
      default: "",
    },

    postedByPhone: {
      type: String,
      trim: true,
    },

    amount: {
      type: Number,
    },

    // =====================================================
    // JOB STATE + DISTRICT
    // =====================================================

    state: {
      type: String,
      trim: true,
    },

    district: {
      type: String,
      trim: true,
    },

    // Worker matching
    workType: {
      type: String,
      trim: true,
    },

    // =====================================================
    // EMPLOYER JOB LOCATION
    // =====================================================

    location: {
      address: {
        type: String,
        default: "",
      },

      village: {
        type: String,
        default: "",
      },

      locality: {
        type: String,
        default: "",
      },

      state: {
        type: String,
        default: "",
      },

      district: {
        type: String,
        default: "",
      },

      postcode: {
        type: String,
        default: "",
      },

      latitude: {
        type: Number,
        default: null,
      },

      longitude: {
        type: Number,
        default: null,
      },
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

export const Job = mongoose.model("Job", jobSchema);