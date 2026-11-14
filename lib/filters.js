import 'server-only'
import Project from '@/models/Project'
import StackFilter from '@/models/StackFilter'
import { ApiError } from './http'
import { filterKey } from './validators'

// The list the site shipped with, used once to fill an empty collection.
const DEFAULTS = [
  ['react', 'React'], ['html', 'HTML & CSS'], ['next', 'Next.js'], ['php', 'PHP'], ['node', 'Node.js'],
  ['nest', 'NestJS'], ['zid', 'Zid'], ['astro', 'Astro'], ['reactnative', 'React Native'],
]

// "vue-js" -> "Vue Js"
const labelFor = (key) => key.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

// First run: create the default filters plus any custom keys projects already use.
// Call after connectDB().
export async function ensureStackFilters() {
  if (await StackFilter.estimatedDocumentCount()) return
  const known = new Set(DEFAULTS.map(([key]) => key))
  const custom = (await Project.distinct('filters')).filter((k) => k && !known.has(k)).sort()
  const rows = [...DEFAULTS, ...custom.map((k) => [k, labelFor(k)])].map(([key, label], order) => ({ key, label, order }))
  // Two requests can race here; the unique index on `key` drops the duplicates.
  await StackFilter.insertMany(rows, { ordered: false }).catch(() => {})
}

// The key comes from the label when left blank, and must be unique.
export async function prepareFilter(data, excludeId) {
  const key = filterKey(data.key || data.label)
  if (!key) throw new ApiError(422, 'Use letters or numbers in the name.', { label: 'Use letters or numbers' })
  if (await StackFilter.exists({ key, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    throw new ApiError(409, `A filter with the key "${key}" already exists.`, { key: 'Already in use' })
  }
  return { ...data, key }
}

// Keep projects pointing at the filter when its key is renamed.
export async function renameFilterKey(before, after) {
  if (!before || before.key === after.key) return
  await Project.updateMany({ filters: before.key }, { $set: { 'filters.$': after.key } })
}

// A removed filter is also taken off every project that used it.
export const dropFilterKey = (item) => Project.updateMany({ filters: item.key }, { $pull: { filters: item.key } })
