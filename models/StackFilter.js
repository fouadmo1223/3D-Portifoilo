import mongoose from 'mongoose'

// One row of the stack filter list on the site ("React", "Next.js", "n8n", …).
// `key` is what projects store in their `filters` array; `label` is what visitors read.
const StackFilterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 30 },
  label: { type: String, required: true, trim: true, maxlength: 40 },
  published: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true })

export default mongoose.models.StackFilter || mongoose.model('StackFilter', StackFilterSchema)
