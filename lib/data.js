import 'server-only'
import { unstable_cache } from 'next/cache'
import connectDB from './db'
import Project from '@/models/Project'
import Experience from '@/models/Experience'
import Skill from '@/models/Skill'
import PersonalInfo from '@/models/PersonalInfo'
import Playground from '@/models/Playground'
import StackFilter from '@/models/StackFilter'
import { ensureStackFilters } from './filters'

export const SITE_TAG = 'site'

const serialize = (value) => JSON.parse(JSON.stringify(value))

export const FALLBACK_PROFILE = {
  name: { en: 'Fouad Mohamed', ar: 'فؤاد محمد' },
  title: { en: 'Frontend Developer / Creative Developer', ar: 'مطوّر واجهات أمامية / مطوّر إبداعي' },
  stack: 'React · Next.js · Node.js · Three.js',
  introduction: {
    en: 'I build web experiences that feel considered — fast, tactile and quietly cinematic.',
    ar: 'أبني تجارب ويب مدروسة — سريعة وملموسة وبلمسة سينمائية هادئة.',
  },
  biography: { en: '', ar: '' },
  philosophy: { en: '', ar: '' },
  email: '',
  phones: [],
  location: { en: 'Egypt', ar: 'مصر' },
  timezone: 'Africa/Cairo',
  cvUrl: '/CV_Fouad_Mohamed.pdf',
  available: true,
  education: [],
  socialLinks: [],
}

const loadSite = unstable_cache(async () => {
  await connectDB()
  await ensureStackFilters()
  const [profile, projects, experience, skills, playground, filters] = await Promise.all([
    PersonalInfo.findOne().lean(),
    Project.find({ published: true }).sort({ featured: -1, order: 1, createdAt: -1 })
      .select('-description -gallery -features').lean(),
    Experience.find({ published: true }).sort({ order: 1, startDate: -1 }).lean(),
    Skill.find({ published: true }).sort({ order: 1 }).lean(),
    Playground.find({ published: true }).sort({ order: 1 }).lean(),
    StackFilter.find({ published: true }).sort({ order: 1, createdAt: 1 }).select('key label -_id').lean(),
  ])
  return serialize({ profile: profile ?? FALLBACK_PROFILE, projects, experience, skills, playground, filters })
}, ['site-data-v2'], { tags: [SITE_TAG], revalidate: 3600 })

// Errors are not cached, so a database blip shows a minimal page and recovers on the next request.
export async function getSiteData() {
  try {
    return { ...(await loadSite()), ok: true }
  } catch (error) {
    console.error('[data] site load failed:', error.message)
    return { profile: FALLBACK_PROFILE, projects: [], experience: [], skills: [], playground: [], filters: [], ok: false }
  }
}

const loadProject = unstable_cache(async (slug) => {
  await connectDB()
  const project = await Project.findOne({ slug, published: true }).lean()
  if (!project) return null
  const siblings = await Project.find({ published: true, featured: true })
    .sort({ order: 1, createdAt: -1 }).select('slug title thumbnail').lean()
  const index = siblings.findIndex((p) => p.slug === slug)
  const next = siblings.length > 1 ? siblings[(index + 1) % siblings.length] : null
  return serialize({ project, next: next && next.slug !== slug ? next : null })
}, ['project-v1'], { tags: [SITE_TAG], revalidate: 3600 })

export async function getProject(slug) {
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return null
  try {
    return await loadProject(slug)
  } catch (error) {
    console.error('[data] project load failed:', error.message)
    return null
  }
}

export const getPublishedSlugs = unstable_cache(async () => {
  await connectDB()
  const rows = await Project.find({ published: true }).select('slug updatedAt').lean()
  return serialize(rows)
}, ['slugs-v1'], { tags: [SITE_TAG], revalidate: 3600 })
