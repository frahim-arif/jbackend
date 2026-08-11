import mongoose from 'mongoose'

const jobSchema = new mongoose.Schema({
  title: String,
  company: String,
  description: String,

  postedByEmail: String,
  postedByPhone: String,

  amount: Number,

  district: String,

  // ⭐ Worker matching ke liye
  workType: String,

  createdAt: {
    type: Date,
    default: Date.now
  }

}, {
  versionKey: false
})

export const Job = mongoose.model('Job', jobSchema)