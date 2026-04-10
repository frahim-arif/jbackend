import mongoose from 'mongoose'

const jobSchema = new mongoose.Schema({
  title: String,
  company: String,
  description: String,
  postedByEmail: String,
  postedByPhone: String,
  amount: Number,      // ✅ add this
  district: String,    // ✅ add this
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false })

export const Job = mongoose.model('Job', jobSchema)
