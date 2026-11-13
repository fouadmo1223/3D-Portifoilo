import { z } from 'zod'
import { isSafeUrl } from './url'

// Kept in sync with models/Skill.js and models/Playground.js (this file is also imported by client forms).
export const SKILL_CATEGORIES = ['frontend', 'backend', 'creative', 'tools', 'soft']
export const EXPERIMENTS = ['', 'liquid-shader', 'magnetic-type', 'gravity-tags']
export const PROJECT_FILTERS = ['react', 'html', 'next', 'php', 'node', 'nest', 'zid', 'astro', 'reactnative']

// Normalises a stack filter to its stored key: "Vue JS" -> "vue-js".
export const filterKey = (s) => String(s).toLowerCase().trim().replace(/[^a-z0-9.+#]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30)

// Strip markup and control characters from user-supplied text.
export const clean = (s) => s.replace(/<[^>]*>/g, '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim()

const text = (max) => z.string().max(max).transform(clean)
const requiredText = (max) => text(max).pipe(z.string().min(1, 'Required'))

const loc = (max, { required = false } = {}) => z.object({
  en: required ? requiredText(max) : text(max).default(''),
  ar: text(max).default(''),
})
const lines = () => z.array(text(300)).max(40).default([]).transform((a) => a.filter(Boolean))
const locList = () => z.object({ en: lines(), ar: lines() })

export { isSafeUrl }
const url = () => z.string().trim().max(1000).default('').refine(isSafeUrl, 'Must be an http(s) URL or a path starting with /')
const requiredUrl = () => url().pipe(z.string().min(1, 'Required'))
const tags = () => z.array(text(60)).max(40).default([]).transform((a) => [...new Set(a.filter(Boolean))])
const bool = (d) => z.boolean().default(d)
const order = () => z.coerce.number().int().min(-100000).max(100000).default(0)
const optionalNumber = (min, max) => z.union([z.coerce.number().min(min).max(max), z.literal(''), z.null()]).optional()
  .transform((v) => (v === '' || v == null ? undefined : v))
const slug = () => z.string().trim().toLowerCase().max(120).default('')
  .transform((s) => s.replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, ''))
const date = () => z.union([z.string(), z.date()]).transform((v) => new Date(v))
  .refine((d) => !Number.isNaN(d.getTime()), 'Invalid date')

export const schemas = {
  projects: z.object({
    title: loc(140, { required: true }),
    slug: slug(),
    shortDescription: loc(280),
    description: loc(6000),
    features: locList(),
    thumbnail: requiredUrl(),
    gallery: z.array(url()).max(24).default([]).transform((a) => a.filter(Boolean)),
    technologies: tags(),
    category: text(60).default('web').transform((s) => s.toLowerCase() || 'web'),
    // The built-in stack filters plus any custom ones added in the admin, stored as short lowercase keys.
    filters: z.array(text(30)).max(24).default([]).transform((a) => [...new Set(a.map(filterKey).filter(Boolean))]),
    year: optionalNumber(2015, 2100),
    liveUrl: url(),
    githubUrl: url(),
    featured: bool(false),
    published: bool(true),
    order: order(),
  }),
  experience: z.object({
    company: loc(140, { required: true }),
    position: loc(140, { required: true }),
    location: loc(140),
    description: loc(4000),
    achievements: locList(),
    startDate: date(),
    endDate: z.union([date(), z.literal(''), z.null()]).optional().transform((v) => (v === '' || v == null ? null : v)),
    current: bool(false),
    technologies: tags(),
    published: bool(true),
    order: order(),
  }),
  skills: z.object({
    name: loc(80, { required: true }),
    category: z.enum(SKILL_CATEGORIES).default('frontend'),
    icon: url(),
    proficiency: optionalNumber(0, 100),
    published: bool(true),
    order: order(),
  }),
  playground: z.object({
    title: loc(120, { required: true }),
    description: loc(600),
    experiment: z.enum(EXPERIMENTS).default(''),
    previewImage: url(),
    demoUrl: url(),
    technologies: tags(),
    published: bool(true),
    order: order(),
  }),
  profile: z.object({
    name: loc(80, { required: true }),
    title: loc(140),
    stack: text(140).default(''),
    introduction: loc(600),
    biography: loc(4000),
    philosophy: loc(2000),
    profileImage: url(),
    email: z.union([z.string().trim().toLowerCase().email().max(200), z.literal('')]).default(''),
    phones: z.array(text(40)).max(6).default([]).transform((a) => a.filter(Boolean)),
    location: loc(140),
    timezone: text(60).default('Africa/Cairo'),
    cvUrl: url(),
    available: bool(true),
    education: z.array(z.object({ title: loc(140), place: loc(140), period: loc(140) })).max(10).default([]),
    socialLinks: z.array(z.object({ label: requiredText(40), url: requiredUrl() })).max(12).default([]),
  }),
}

// Fields an admin may flip from list views without sending the whole document.
export const toggleSchema = z.object({
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
  read: z.boolean().optional(),
}).strict()

export const reorderSchema = z.object({ ids: z.array(z.string().regex(/^[a-f0-9]{24}$/)).min(1).max(500) })

export const contactSchema = z.object({
  name: requiredText(120),
  email: z.string().trim().toLowerCase().email('Please enter a valid email').max(200),
  subject: requiredText(200),
  message: text(5000).pipe(z.string().min(10, 'Tell me a little more (10+ characters)')),
  company: z.string().max(0).optional(), // honeypot: people leave it empty, bots fill it
})

export const loginSchema = z.object({
  username: z.string().trim().min(1).max(120),
  password: z.string().min(1).max(200),
})
