import mongoose from 'mongoose'
import { localized } from './localized'

export const SKILL_CATEGORIES = ['frontend', 'backend', 'creative', 'tools', 'soft']

const SkillSchema = new mongoose.Schema({
  name: localized({ required: true, max: 80 }),
  category: { type: String, enum: SKILL_CATEGORIES, default: 'frontend' },
  icon: { type: String, trim: true, default: '' },
  proficiency: { type: Number, min: 0, max: 100 },
  published: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  // Shared with the classic portfolio's copy of this record (lib/mirror.js).
  syncId: { type: String, index: true },
}, { timestamps: true })

export default mongoose.models.Skill || mongoose.model('Skill', SkillSchema)
