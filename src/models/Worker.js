
import mongoose from 'mongoose'

const workerSchema = new mongoose.Schema({
  name: String,
  mobile: String,
  district: String,
  workType: String,
  kycType: String,
  kycNumber: String,
  kycDocument: String,

  status: {
    type: String,
    default: 'Pending'
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  versionKey: false
})

export const Worker = mongoose.model('Worker', workerSchema)

