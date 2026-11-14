import { SKILL_CATEGORIES } from '@/lib/validators'

// Field definitions drive every form. Types:
//   loc (English + Arabic text; `area` for multi-line), locList (one item per line, both languages),
//   text, number, date, bool, select, checks (multi-select), image, gallery, tags, lines, repeater
const published = { name: 'published', type: 'bool', label: 'Published', hint: 'Visible on the public site.' }

export const RESOURCES = {
  projects: {
    label: 'Projects',
    singular: 'project',
    title: (x) => x.title?.en,
    subtitle: (x) => [x.category, x.year, x.technologies?.slice(0, 3).join(', ')].filter(Boolean).join(' · '),
    image: (x) => x.thumbnail,
    layout: 'grid',
    toggles: ['published', 'featured'],
    groups: [
      { title: 'Basics', fields: [
        { name: 'title', type: 'loc', label: 'Title', required: true },
        { name: 'slug', type: 'text', label: 'URL slug', hint: 'Leave blank to generate it from the English title.', mono: true },
        { name: 'shortDescription', type: 'loc', label: 'Short description', area: true, rows: 2, hint: 'One or two lines, shown on cards.' },
        { name: 'description', type: 'loc', label: 'Full description', area: true, rows: 8 },
        { name: 'features', type: 'locList', label: 'Key features', hint: 'One per line.' },
      ] },
      { title: 'Media', fields: [
        { name: 'thumbnail', type: 'image', label: 'Cover image', required: true },
        { name: 'gallery', type: 'gallery', label: 'Gallery' },
      ] },
      { title: 'Details', fields: [
        { name: 'filters', type: 'filters', label: 'Stack filters', hint: 'Which filter groups list this project on the site. Add a new one here, or remove one with its x button. Rename and reorder them on the Filters page.' },
        { name: 'technologies', type: 'tags', label: 'Technologies' },
        { name: 'category', type: 'text', label: 'Category', half: true },
        { name: 'year', type: 'number', label: 'Year', half: true, min: 2015, max: 2100 },
        { name: 'liveUrl', type: 'text', label: 'Live URL', half: true, placeholder: 'https://' },
        { name: 'githubUrl', type: 'text', label: 'GitHub URL', half: true, placeholder: 'https://' },
      ] },
      { title: 'Visibility', fields: [
        { name: 'featured', type: 'bool', label: 'Featured', hint: 'Shown in the main reel on the home page.' },
        published,
      ] },
    ],
  },
  experience: {
    label: 'Experience',
    singular: 'role',
    title: (x) => x.position?.en,
    subtitle: (x) => [x.company?.en, `${fmt(x.startDate)} — ${x.current ? 'Present' : fmt(x.endDate)}`].filter(Boolean).join(' · '),
    toggles: ['published'],
    groups: [
      { title: 'Role', fields: [
        { name: 'position', type: 'loc', label: 'Position', required: true },
        { name: 'company', type: 'loc', label: 'Company', required: true },
        { name: 'location', type: 'loc', label: 'Location' },
        { name: 'description', type: 'loc', label: 'Description', area: true, rows: 5 },
        { name: 'achievements', type: 'locList', label: 'Achievements', hint: 'One per line.' },
      ] },
      { title: 'Dates', fields: [
        { name: 'startDate', type: 'date', label: 'Start', half: true, required: true },
        { name: 'endDate', type: 'date', label: 'End', half: true, hint: 'Ignored while "Current role" is on.' },
        { name: 'current', type: 'bool', label: 'Current role' },
      ] },
      { title: 'Details', fields: [
        { name: 'technologies', type: 'tags', label: 'Technologies' },
        published,
      ] },
    ],
  },
  filters: {
    label: 'Filters',
    singular: 'filter',
    title: (x) => x.label,
    subtitle: (x) => `key: ${x.key}`,
    toggles: ['published'],
    deleteNote: 'It is also removed from every project that uses it.',
    groups: [
      { title: 'Filter', fields: [
        { name: 'label', type: 'text', label: 'Name', required: true, half: true, hint: 'What visitors see, e.g. "n8n" or "React Native".' },
        { name: 'key', type: 'text', label: 'Key', half: true, mono: true, hint: 'Short id stored on projects. Leave blank to make it from the name.' },
        { ...published, hint: 'Hidden filters stay on their projects but are not listed on the site.' },
      ] },
    ],
  },
  skills: {
    label: 'Skills',
    singular: 'skill',
    title: (x) => x.name?.en,
    subtitle: (x) => [x.category, x.proficiency != null ? `${x.proficiency}%` : null].filter(Boolean).join(' · '),
    image: (x) => x.icon,
    toggles: ['published'],
    groups: [
      { title: 'Skill', fields: [
        { name: 'name', type: 'loc', label: 'Name', required: true },
        { name: 'category', type: 'select', label: 'Category', options: SKILL_CATEGORIES, half: true },
        { name: 'proficiency', type: 'number', label: 'Proficiency (0–100)', half: true, min: 0, max: 100 },
        { name: 'icon', type: 'image', label: 'Icon', hint: 'Optional. A small square image or an icon URL.' },
        published,
      ] },
    ],
  },
}

export const PROFILE_GROUPS = [
  { title: 'Identity', fields: [
    { name: 'name', type: 'loc', label: 'Name', required: true },
    { name: 'title', type: 'loc', label: 'Job title' },
    { name: 'stack', type: 'text', label: 'Stack line', hint: 'Shown under the title in the hero.' },
    { name: 'profileImage', type: 'image', label: 'Profile image' },
    { name: 'available', type: 'bool', label: 'Available for new projects' },
  ] },
  { title: 'Story', fields: [
    { name: 'introduction', type: 'loc', label: 'Hero introduction', area: true, rows: 3 },
    { name: 'biography', type: 'loc', label: 'Biography', area: true, rows: 6 },
    { name: 'philosophy', type: 'loc', label: 'How I work', area: true, rows: 4 },
  ] },
  { title: 'Contact', fields: [
    { name: 'email', type: 'text', label: 'Email', half: true },
    { name: 'timezone', type: 'text', label: 'Time zone', half: true, hint: 'IANA name, e.g. Africa/Cairo.', mono: true },
    { name: 'location', type: 'loc', label: 'Location' },
    { name: 'phones', type: 'lines', label: 'Phone numbers', hint: 'One per line.' },
    { name: 'cvUrl', type: 'text', label: 'CV link', placeholder: 'https:// or /file.pdf' },
  ] },
  { title: 'Education', fields: [
    { name: 'education', type: 'repeater', label: 'Education', add: 'Add entry', blank: { title: { en: '', ar: '' }, place: { en: '', ar: '' }, period: { en: '', ar: '' } }, fields: [
      { name: 'title', type: 'loc', label: 'Degree or course' },
      { name: 'place', type: 'loc', label: 'School' },
      { name: 'period', type: 'loc', label: 'Period' },
    ] },
  ] },
  { title: 'Links', fields: [
    { name: 'socialLinks', type: 'repeater', label: 'Social links', add: 'Add link', blank: { label: '', url: '' }, fields: [
      { name: 'label', type: 'text', label: 'Label', half: true },
      { name: 'url', type: 'text', label: 'URL', half: true, placeholder: 'https://' },
    ] },
  ] },
]

function fmt(d) {
  if (!d) return ''
  const date = new Date(d)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}
export { fmt as formatMonthYear }

// A blank document for "new": every field present so inputs stay controlled.
export function blankFrom(groups) {
  const out = {}
  for (const f of groups.flatMap((g) => g.fields)) {
    if (f.type === 'loc') out[f.name] = { en: '', ar: '' }
    else if (f.type === 'locList') out[f.name] = { en: [], ar: [] }
    else if (['gallery', 'tags', 'lines', 'repeater', 'checks', 'filters'].includes(f.type)) out[f.name] = []
    else if (f.type === 'bool') out[f.name] = f.name === 'published' || f.name === 'available'
    else if (f.type === 'select') out[f.name] = f.options[0]
    else out[f.name] = ''
  }
  return out
}
