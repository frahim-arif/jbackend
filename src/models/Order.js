// import mongoose from 'mongoose'

// const orderSchema = new mongoose.Schema({
//   merchantOrderId: { type: String, required: true, unique: true, index: true },
//   amount: { type: Number, required: true },
//   customerName: { type: String, required: true },
//   mobileNumber: { type: String, required: true },
//   email: { type: String },
//   note: { type: String },
//   status: { type: String, default: 'PENDING', index: true },
//   // store raw webhook payloads for audit/debug (optional)
//   lastWebhook: { type: Object },
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now },
// }, { versionKey: false })

// orderSchema.pre('save', function(next){
//   this.updatedAt = new Date()
//   next()
// })

// export const Order = mongoose.model('Order', orderSchema)


import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema({
  merchantOrderId: { type: String, required: true, unique: true, index: true },
  amount: { type: Number, required: true },
  customerName: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  email: { type: String },
  note: { type: String },
  jobId: { type: String, index: true }, // <-- new
  status: { type: String, default: 'PENDING', index: true },
  lastWebhook: { type: Object },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { versionKey: false,
  timestamps: true
 })

export const Order = mongoose.model('Order', orderSchema)