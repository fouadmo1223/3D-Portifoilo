import { pick, pickList } from './i18n'

export const REEL_SIZE = 8

const project = (p, locale) => ({
  id: p._id,
  slug: p.slug,
  title: pick(p.title, locale),
  short: pick(p.shortDescription, locale),
  category: p.category,
  filters: p.filters ?? [],
  technologies: p.technologies ?? [],
  year: p.year ?? null,
  thumbnail: p.thumbnail,
  liveUrl: p.liveUrl,
  githubUrl: p.githubUrl,
  featured: p.featured,
})

// Turns { en, ar } documents into plain strings for one language,
// so client components receive small, ready-to-render props.
export function localizeSite(data, locale) {
  const p = data.profile
  const featured = data.projects.filter((x) => x.featured)
  const reel = featured.slice(0, REEL_SIZE)
  const reelIds = new Set(reel.map((x) => x._id))
  return {
    profile: {
      name: pick(p.name, locale),
      title: pick(p.title, locale),
      stack: p.stack,
      introduction: pick(p.introduction, locale),
      biography: pick(p.biography, locale),
      philosophy: pick(p.philosophy, locale),
      email: p.email,
      phones: p.phones ?? [],
      location: pick(p.location, locale),
      timezone: p.timezone || 'Africa/Cairo',
      cvUrl: p.cvUrl,
      available: p.available !== false,
      education: (p.education ?? []).map((e) => ({ title: pick(e.title, locale), place: pick(e.place, locale), period: pick(e.period, locale) })),
      socialLinks: p.socialLinks ?? [],
    },
    reel: reel.map((x) => project(x, locale)),
    archive: data.projects.filter((x) => !reelIds.has(x._id)).map((x) => project(x, locale)),
    projects: data.projects.map((x) => project(x, locale)),
    filters: (data.filters ?? []).map((f) => ({ key: f.key, label: f.label })),
    experience: data.experience.map((e) => ({
      id: e._id,
      company: pick(e.company, locale),
      position: pick(e.position, locale),
      location: pick(e.location, locale),
      description: pick(e.description, locale),
      achievements: pickList(e.achievements, locale),
      start: e.startDate,
      end: e.endDate,
      current: e.current,
      technologies: e.technologies ?? [],
    })),
    skills: data.skills.map((s) => ({ id: s._id, name: pick(s.name, locale), category: s.category, icon: s.icon })),
    playground: data.playground.map((x) => ({
      id: x._id,
      title: pick(x.title, locale),
      description: pick(x.description, locale),
      experiment: x.experiment,
      previewImage: x.previewImage,
      demoUrl: x.demoUrl,
      technologies: x.technologies ?? [],
    })),
  }
}

export function formatMonth(date, locale) {
  if (!date) return ''
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(date))
}
