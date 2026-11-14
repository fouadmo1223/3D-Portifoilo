import mongoose from 'mongoose'
import { localized, localizedList } from './localized'

const ExperienceSchema = new mongoose.Schema({
  company: localized({ required: true, max: 140 }),
  position: localized({ required: true, max: 140 }),
  location: localized({ max: 140 }),
  description: localized({ max: 4000 }),
  achievements: localizedList(),
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  current: { type: Boolean, default: false },
  technologies: { type: [{ type: String, trim: true, maxlength: 60 }], default: [] },
  published: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  // Shared with the classic portfolio's copy of this record (lib/mirror.js).
  syncId: { type: String, index: true },
}, { timestamps: true })

export default mongoose.models.Experience || mongoose.model('Experience', ExperienceSchema)
