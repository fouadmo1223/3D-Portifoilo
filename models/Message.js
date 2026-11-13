import mongoose from 'mongoose'

const MessageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
  subject: { type: String, required: true, trim: true, maxlength: 200 },
  message: { type: String, required: true, trim: true, maxlength: 5000 },
  read: { type: Boolean, default: false, index: true },
}, { timestamps: true })

export default mongoose.models.Message || mongoose.model('Message', MessageSchema)
