// Copies content from the old portfolio database into the new one, reshaped for the 3D site.
//
//   OLD_MONGODB_URI=... npm run migrate            (or set OLD_ENV_FILE=../.env.local)
//   npm run migrate -- --force                     (replace content already in the new DB)
//
// Messages are not copied. The script never writes to the old database.
import { readFileSync } from 'node:fs'
import mongoose from 'mongoose'

const force = process.argv.includes('--force')

function envFrom(file, key) {
  try {
    const line = readFileSync(file, 'utf8').split(/\r?\n/).find((l) => l.startsWith(`${key}=`))
    return line?.slice(key.length + 1).trim().replace(/^["']|["']$/g, '')
  } catch {
    return undefined
  }
}

const NEW_URI = process.env.MONGODB_URI
const OLD_URI = process.env.OLD_MONGODB_URI || envFrom(process.env.OLD_ENV_FILE || '../.env.local', 'MONGODB_URI')
if (!NEW_URI || !OLD_URI) {
  console.error('Need MONGODB_URI (new) and OLD_MONGODB_URI or OLD_ENV_FILE (old).')
  process.exit(1)
}
if (NEW_URI === OLD_URI) {
  console.error('Old and new URIs are identical; refusing to run.')
  process.exit(1)
}

const L = (en = '', ar = '') => ({ en: (en || '').trim(), ar: (ar || '').trim() })
const slugify = (s) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 80) || 'project'
const firstSentence = (s = '', max = 240) => {
  const t = s.replace(/\s+/g, ' ').trim()
  const cut = t.match(/^.{20,}?[.!?؟](\s|$)/)?.[0]?.trim() || t
  return cut.length > max ? `${cut.slice(0, max - 1).trimEnd()}…` : cut
}
const cleanImage = (src = '') => src.replace(/\?height=\d+&width=\d+$/, '')
const yearFromImage = (src = '') => {
  const v = src.match(/\/upload\/v(\d{10})\//)?.[1]
  return v ? new Date(Number(v) * 1000).getUTCFullYear() : undefined
}

function categoryOf(p) {
  const c = (p.category || '').toLowerCase()
  const t = (p.title || '').toLowerCase()
  if (c.includes('reactnative')) return 'mobile'
  if (/\b(nest|node|express)\b/.test(c) && !/\b(next|react)\b/.test(c)) return 'backend'
  if (c.includes('zid') || /store|e-?com|cart|souq|bazaar|boutique|pharmacy/.test(t)) return 'commerce'
  if (/\bhtml\b/.test(c)) return 'landing'
  return 'web'
}

// Brief-listed projects lead the reel, followed by the ones previously marked "selected work".
const LEAD = ['wyngo', 'nourscene', 'smart student', 'thoughts frontend', 'fresh cart with auth']

const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 }
function parsePeriod(period = '', fallback) {
  const [a, b] = period.split(/\s+[-–]\s+/)
  const parse = (s) => {
    const m = s?.trim().match(/^([A-Za-z]{3})[a-z]*\.?\s+(\d{4})$/)
    return m ? new Date(Date.UTC(Number(m[2]), MONTHS[m[1].toLowerCase()] ?? 0, 1)) : null
  }
  const current = /present|now|current/i.test(b || '')
  return { startDate: parse(a) || (fallback ? new Date(fallback) : new Date()), endDate: current ? null : parse(b), current }
}

const SKILL_GROUPS = {
  frontend: ['css3', 'typescript', 'tailwind css', 'jquery', 'material ui', 'shadcn ui', 'html5', 'next.js', 'redux', 'react', 'javascript', 'bootstrap', 'chakra ui'],
  backend: ['php', 'mongodb', 'express', 'socket.io', 'node.js', 'jwt', 'nest.js', 'mysql', 'odoo'],
  tools: ['docker', 'git', 'vite'],
}
const SOFT = {
  problemSolving: ['Problem solving', 'حل المشكلات'],
  teamwork: ['Teamwork', 'العمل الجماعي'],
  adaptability: ['Adaptability', 'القدرة على التكيّف'],
  timeManagement: ['Time management', 'إدارة الوقت'],
}
const SI = (n) => `https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/${n}.svg`
const DI = (n, v = 'original') => `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${n}/${n}-${v}.svg`
// Skills named in the brief that the old site did not list.
const EXTRA_SKILLS = [
  ['Three.js', 'creative', DI('threejs')],
  ['React Three Fiber', 'creative', ''],
  ['GSAP', 'creative', SI('greensock')],
  ['ScrollTrigger', 'creative', ''],
  ['Framer Motion', 'creative', SI('framer')],
  ['Lenis', 'creative', ''],
  ['Mongoose', 'backend', DI('mongoose')],
  ['REST APIs', 'backend', ''],
]

const PLAYGROUND = [
  {
    title: L('Liquid Glass', 'زجاج سائل'),
    description: L('A fragment shader that ripples under your cursor. Pure GLSL, no textures.', 'Shader يتموّج تحت مؤشر الماوس. GLSL خالص بدون صور.'),
    experiment: 'liquid-shader', technologies: ['GLSL', 'Three.js', 'R3F'],
  },
  {
    title: L('Magnetic Type', 'حروف مغناطيسية'),
    description: L('Letters that lean away from the pointer and spring back with damped physics.', 'حروف تبتعد عن المؤشر وتعود بحركة نابضية مخمّدة.'),
    experiment: 'magnetic-type', technologies: ['Canvas', 'Spring physics'],
  },
  {
    title: L('Gravity Tags', 'وسوم بالجاذبية'),
    description: L('My toolkit as physical objects. Grab a tag and throw it.', 'أدواتي كأجسام فيزيائية. أمسك أي وسم وارمه.'),
    experiment: 'gravity-tags', technologies: ['Verlet physics', 'Canvas 2D'],
  },
]

async function main() {
  const oldConn = await mongoose.createConnection(OLD_URI, { serverSelectionTimeoutMS: 15000 }).asPromise()
  const newConn = await mongoose.createConnection(NEW_URI, { serverSelectionTimeoutMS: 15000 }).asPromise()
  const o = (name) => oldConn.db.collection(name)
  const n = (name) => newConn.db.collection(name)
  console.log(`old db: ${oldConn.name}  →  new db: ${newConn.name}`)

  const existing = await n('projects').countDocuments()
  if (existing && !force) {
    console.error(`New database already has ${existing} projects. Re-run with --force to replace content.`)
    process.exit(1)
  }

  const now = new Date()
  const stamp = (d) => ({ ...d, createdAt: now, updatedAt: now, __v: 0 })

  // Profile
  const hero = await o('heros').findOne() || {}
  const about = await o('abouts').findOne() || {}
  const profile = stamp({
    name: L('Fouad Mohamed', 'فؤاد محمد'),
    title: L('Frontend Developer / Creative Developer', 'مطوّر واجهات أمامية / مطوّر إبداعي'),
    stack: 'React · Next.js · Node.js · Three.js',
    introduction: L(
      'I build modern web experiences that feel considered — fast, tactile and quietly cinematic. From the database schema to the last shader, I care about every layer.',
      'أبني تجارب ويب حديثة ومدروسة — سريعة وملموسة وبلمسة سينمائية هادئة. من مخطط قاعدة البيانات حتى آخر shader، أهتم بكل طبقة.',
    ),
    biography: L(about.description, about.descriptionAr),
    philosophy: L(
      'Good interfaces are invisible until they delight. I start from content and performance, then add motion only where it explains, guides or rewards.',
      'الواجهة الجيدة لا تُلاحظ حتى تُبهج. أبدأ بالمحتوى والأداء، ثم أضيف الحركة فقط حين تشرح أو توجّه أو تكافئ.',
    ),
    profileImage: '',
    email: (hero.email || '').toLowerCase(),
    phones: [about.phoneUae && `+971 ${about.phoneUae.replace(/^0/, '')}`, about.phoneEgypt && `+20 ${about.phoneEgypt.replace(/^0/, '')}`].filter(Boolean),
    location: L(about.location, about.locationAr),
    timezone: 'Africa/Cairo',
    cvUrl: hero.cvUrl || '/CV_Fouad_Mohamed.pdf',
    available: true,
    education: [
      { title: L(about.educationTitle1, about.educationTitle1Ar), place: L(about.educationDesc1, about.educationDesc1Ar), period: L(about.educationDate1, about.educationDate1Ar) },
      { title: L(about.educationTitle2, about.educationTitle2Ar), place: L(about.educationDesc2, about.educationDesc2Ar), period: L(about.educationDate2, about.educationDate2Ar) },
    ].filter((e) => e.title.en),
    socialLinks: [
      hero.githubUrl && { label: 'GitHub', url: hero.githubUrl },
      hero.linkedinUrl && { label: 'LinkedIn', url: hero.linkedinUrl },
    ].filter(Boolean),
  })

  // Projects
  const oldProjects = await o('projects').find().sort({ order: 1, _id: -1 }).toArray()
  const used = new Set()
  const projects = oldProjects.map((p) => {
    let slug = slugify(p.title)
    for (let i = 2; used.has(slug); i++) slug = `${slugify(p.title)}-${i}`
    used.add(slug)
    const key = p.title.trim().toLowerCase()
    const lead = LEAD.indexOf(key)
    return {
      lead, selected: Boolean(p.isSelectedWork),
      doc: {
        title: L(p.title, p.titleAr),
        slug,
        shortDescription: L(firstSentence(p.description), firstSentence(p.descriptionAr)),
        description: L(p.description, p.descriptionAr),
        features: { en: (p.features || []).filter(Boolean), ar: (p.featuresAr || []).filter(Boolean) },
        thumbnail: cleanImage(p.image),
        gallery: [],
        technologies: [...new Set((p.technologies || []).map((t) => t.trim()).filter(Boolean))],
        category: categoryOf(p),
        ...(yearFromImage(p.image) ? { year: yearFromImage(p.image) } : {}),
        liveUrl: p.liveUrl || '',
        githubUrl: p.githubUrl || '',
        featured: lead >= 0 || Boolean(p.isSelectedWork),
        published: true,
      },
    }
  })
  projects.sort((a, b) => {
    const la = a.lead < 0 ? 99 : a.lead
    const lb = b.lead < 0 ? 99 : b.lead
    return la - lb || Number(b.selected) - Number(a.selected)
  })
  const projectDocs = projects.map((p, order) => stamp({ ...p.doc, order }))

  // Experience
  const oldExperience = await o('experiences').find().sort({ order: 1 }).toArray()
  const experienceDocs = oldExperience.map((e, order) => stamp({
    company: L(e.company, e.companyAr),
    position: L(e.title, e.titleAr),
    location: L(e.location, e.locationAr),
    description: L(e.description, e.descriptionAr),
    achievements: { en: [], ar: [] },
    ...parsePeriod(e.period, e.dateObj),
    technologies: e.technologies || [],
    published: true,
    order,
  }))

  // Skills
  const oldSkills = await o('skills').find().sort({ order: 1 }).toArray()
  const skillDocs = []
  for (const s of oldSkills) {
    if (s.isSoftSkill) {
      const [en, ar] = SOFT[s.name] || [s.name, s.nameAr || '']
      skillDocs.push({ name: L(en, ar), category: 'soft', icon: '' })
      continue
    }
    const lower = s.name.trim().toLowerCase()
    const category = Object.entries(SKILL_GROUPS).find(([, names]) => names.includes(lower))?.[0] || 'frontend'
    skillDocs.push({ name: L(s.name, s.nameAr || s.name), category, icon: s.icon || '' })
  }
  for (const [name, category, icon] of EXTRA_SKILLS) {
    if (!skillDocs.some((s) => s.name.en.toLowerCase() === name.toLowerCase())) skillDocs.push({ name: L(name, name), category, icon })
  }
  const CAT_ORDER = ['frontend', 'backend', 'creative', 'tools', 'soft']
  skillDocs.sort((a, b) => CAT_ORDER.indexOf(a.category) - CAT_ORDER.indexOf(b.category))
  const skillRows = skillDocs.map((s, order) => stamp({ ...s, published: true, order }))

  const playgroundDocs = PLAYGROUND.map((p, order) => stamp({ ...p, previewImage: '', demoUrl: '', published: true, order }))

  for (const name of ['projects', 'experiences', 'skills', 'personalinfos', 'playgrounds']) await n(name).deleteMany({})
  await n('personalinfos').insertOne(profile)
  if (projectDocs.length) await n('projects').insertMany(projectDocs)
  if (experienceDocs.length) await n('experiences').insertMany(experienceDocs)
  if (skillRows.length) await n('skills').insertMany(skillRows)
  await n('playgrounds').insertMany(playgroundDocs)
  await n('projects').createIndex({ slug: 1 }, { unique: true })

  console.log(`profile: 1 · projects: ${projectDocs.length} (featured ${projectDocs.filter((p) => p.featured).length}) · experience: ${experienceDocs.length} · skills: ${skillRows.length} · playground: ${playgroundDocs.length}`)
  await Promise.all([oldConn.close(), newConn.close()])
}

main().catch((error) => {
  console.error('Migration failed:', error.message.replace(/\/\/[^@]*@/, '//***@'))
  process.exit(1)
})
