import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: String,

    company: String,

    description: String,

    postedByEmail: String,

    postedByPhone: String,

    amount: Number,

    district: String,

    // Worker matching ke liye
    workType: String,

    // =====================================================
    // EMPLOYER JOB LOCATION
    // Apply karne wale worker ki location nahi
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