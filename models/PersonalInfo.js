import mongoose from 'mongoose'
import { localized } from './localized'

const EducationSchema = new mongoose.Schema({
  title: localized({ max: 140 }),
  place: localized({ max: 140 }),
  period: localized({ max: 140 }),
}, { _id: false })

const PersonalInfoSchema = new mongoose.Schema({
  name: localized({ required: true, max: 80 }),
  title: localized({ max: 140 }),
  stack: { type: String, trim: true, default: 'React · Next.js · Node.js · Three.js', maxlength: 140 },
  introduction: localized({ max: 600 }),
  biography: localized({ max: 4000 }),
  philosophy: localized({ max: 2000 }),
  profileImage: { type: String, trim: true, default: '' },
  email: { type: String, trim: true, lowercase: true, default: '' },
  phones: { type: [{ type: String, trim: true, maxlength: 40 }], default: [] },
  location: localized({ max: 140 }),
  timezone: { type: String, default: 'Africa/Cairo' },
  cvUrl: { type: String, trim: true, default: '' },
  available: { type: Boolean, default: true },
  education: { type: [EducationSchema], default: [] },
  socialLinks: {
    type: [{ label: { type: String, trim: true, maxlength: 40 }, url: { type: String, trim: true }, _id: false }],
    default: [],
  },
}, { timestamps: true })

export default mongoose.models.PersonalInfo || mongoose.model('PersonalInfo', PersonalInfoSchema)
