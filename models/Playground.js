import mongoose from 'mongoose'
import { localized } from './localized'

// "experiment" names an interactive piece built into the site; leave it empty
// to show an external demo (previewImage + demoUrl) instead.
export const EXPERIMENTS = ['', 'liquid-shader', 'magnetic-type', 'gravity-tags']

const PlaygroundSchema = new mongoose.Schema({
  title: localized({ required: true, max: 120 }),
  description: localized({ max: 600 }),
  experiment: { type: String, enum: EXPERIMENTS, default: '' },
  previewImage: { type: String, trim: true, default: '' },
  demoUrl: { type: String, trim: true, default: '' },
  technologies: { type: [{ type: String, trim: true, maxlength: 60 }], default: [] },
  published: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true })

export default mongoose.models.Playground || mongoose.model('Playground', PlaygroundSchema)
