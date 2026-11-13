import mongoose from 'mongoose'
import { localized, localizedList } from './localized'

const ProjectSchema = new mongoose.Schema({
  title: localized({ required: true, max: 140 }),
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[a-z0-9-]+$/ },
  shortDescription: localized({ max: 280 }),
  description: localized({ max: 6000 }),
  features: localizedList(),
  thumbnail: { type: String, required: true, trim: true },
  gallery: { type: [{ type: String, trim: true }], default: [] },
  technologies: { type: [{ type: String, trim: true, maxlength: 60 }], default: [] },
  category: { type: String, trim: true, lowercase: true, default: 'web', maxlength: 60 },
  // Stack groups the public filter uses: react, html, next, php, node, nest, zid, astro, reactnative.
  filters: { type: [{ type: String, trim: true, lowercase: true, maxlength: 30 }], default: [] },
  year: { type: Number, min: 2015, max: 2100 },
  liveUrl: { type: String, trim: true, default: '' },
  githubUrl: { type: String, trim: true, default: '' },
  featured: { type: Boolean, default: false, index: true },
  published: { type: Boolean, default: true, index: true },
  order: { type: Number, default: 0 },
}, { timestamps: true })

ProjectSchema.index({ published: 1, featured: -1, order: 1 })

export default mongoose.models.Project || mongoose.model('Project', ProjectSchema)
