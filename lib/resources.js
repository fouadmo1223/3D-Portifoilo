import 'server-only'
import { revalidateTag } from 'next/cache'
import Project from '@/models/Project'
import Experience from '@/models/Experience'
import Skill from '@/models/Skill'
import Playground from '@/models/Playground'
import Message from '@/models/Message'
import { schemas } from './validators'
import { ApiError } from './http'
import { SITE_TAG } from './data'

// One registry drives every admin CRUD endpoint, so the routes stay generic.
export const resources = {
  projects: { model: Project, schema: schemas.projects, sort: { order: 1, createdAt: -1 }, search: ['title.en', 'title.ar', 'category', 'technologies'] },
  experience: { model: Experience, schema: schemas.experience, sort: { order: 1, startDate: -1 }, search: ['company.en', 'position.en'] },
  skills: { model: Skill, schema: schemas.skills, sort: { order: 1 }, search: ['name.en', 'name.ar', 'category'] },
  playground: { model: Playground, schema: schemas.playground, sort: { order: 1 }, search: ['title.en', 'title.ar'] },
  messages: { model: Message, schema: null, sort: { createdAt: -1 }, search: ['name', 'email', 'subject'], readOnly: true },
}

export function getResource(name) {
  const resource = resources[name]
  if (!resource) throw new ApiError(404, 'Unknown resource.')
  return resource
}

export const refreshSite = () => revalidateTag(SITE_TAG, { expire: 0 })

const slugify = (s) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 80)

// Projects need a unique URL slug; derive one from the English title when blank.
export async function ensureUniqueSlug(data, excludeId) {
  const base = data.slug || slugify(data.title.en) || 'project'
  let candidate = base
  for (let i = 2; await Project.exists({ slug: candidate, ...(excludeId ? { _id: { $ne: excludeId } } : {}) }); i++) {
    candidate = `${base}-${i}`
  }
  return { ...data, slug: candidate }
}

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
