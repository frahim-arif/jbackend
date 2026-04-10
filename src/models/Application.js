import mongoose from 'mongoose'

const applicationSchema = new mongoose.Schema({
  jobId: { type: String, required: true, index: true },
  jobTitle: { type: String },
  merchantOrderId: { type: String, required: true, unique: true, index: true },
  txnId: { type: String }, // optional transaction id from PG
  applicantName: { type: String, required: true },
  applicantEmail: { type: String },
  applicantPhone: { type: String, required: true },
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false })

export const Application = mongoose.model('Application', applicationSchema)
