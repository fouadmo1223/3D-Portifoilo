import 'server-only'
import mongoose from 'mongoose'
import { randomUUID } from 'crypto'

// Mirrors skills, projects and experience into the classic portfolio's database, so a change made
// in this dashboard shows up on the other site too (the classic site does the same in reverse).
//
// Both copies of a record share a `syncId`. A record that has never been synced is matched on the
// other side by its English name/title/company the first time it changes, so existing data links
// up without duplicates. Mirroring is best effort: a failure is logged and never blocks the save.
//
// Env: MIRROR_MONGODB_URI (the classic site's database), MIRROR_SITE_URL (its address, to refresh
// its cache) and SYNC_SECRET (shared by both sites). Without MIRROR_MONGODB_URI nothing is mirrored.

export const SYNCED = ['skills', 'projects', 'experience']
const COLLECTION = { skills: 'skills', projects: 'projects', experience: 'experiences' }
// The field each kind is matched on in the classic database.
const MATCH_FIELD = { skills: 'name', projects: 'title', experience: 'company' }
const NAME_OF = { skills: (d) => d.name?.en, projects: (d) => d.title?.en, experience: (d) => d.company?.en }

async function mirrorDb() {
  const uri = process.env.MIRROR_MONGODB_URI
  if (!uri) return null
  if (!globalThis.__p3dMirror) {
    globalThis.__p3dMirror = mongoose
      .createConnection(uri, { bufferCommands: false, serverSelectionTimeoutMS: 8000, maxPoolSize: 3 })
      .asPromise()
      .catch((e) => { globalThis.__p3dMirror = null; throw e })
  }
  return globalThis.__p3dMirror
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const sameText = (field, value) => ({ [field]: { $regex: `^${escapeRegex(value.trim())}$`, $options: 'i' } })

// The record linked to this syncId, or else an unlinked one with the same English name.
const linkFilter = (kind, syncId, name) => ({
  $or: [{ syncId }, ...(name ? [{ syncId: { $exists: false }, ...sameText(MATCH_FIELD[kind], name) }] : [])],
})

async function nextOrder(col) {
  const last = await col.find({}, { projection: { order: 1 } }).sort({ order: -1 }).limit(1).next()
  return (last?.order ?? -1) + 1
}

// "Mar 2023"
const month = (d) => new Date(d).toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })

function toClassic(kind, item) {
  if (kind === 'skills') {
    const set = { name: item.name.en, nameAr: item.name.ar || '', isSoftSkill: item.category === 'soft' }
    // The classic site requires an icon; keep its own one when this side has none.
    return item.icon ? { set: { ...set, icon: item.icon }, insert: {} } : { set, insert: { icon: '' } }
  }
  if (kind === 'projects') {
    return {
      set: {
        title: item.title.en, titleAr: item.title.ar || '',
        description: item.description?.en || item.shortDescription?.en || '',
        descriptionAr: item.description?.ar || item.shortDescription?.ar || '',
        features: item.features?.en || [], featuresAr: item.features?.ar || [],
        image: item.thumbnail || '',
        technologies: item.technologies || [],
        category: (item.filters || []).join(' ') || item.category || 'web',
        liveUrl: item.liveUrl || '', githubUrl: item.githubUrl || '',
        isSelectedWork: !!item.featured,
      },
      insert: {},
    }
  }
  const ongoing = item.current || !item.endDate
  return {
    set: {
      title: item.position.en, titleAr: item.position.ar || '',
      company: item.company.en, companyAr: item.company.ar || '',
      location: item.location?.en || '', locationAr: item.location?.ar || '',
      description: item.description?.en || '', descriptionAr: item.description?.ar || '',
      technologies: item.technologies || [],
      period: `${month(item.startDate)} - ${ongoing ? 'Present' : month(item.endDate)}`,
      dateObj: new Date(item.startDate),
    },
    insert: {},
  }
}

async function refreshOtherSite() {
  const base = process.env.MIRROR_SITE_URL
  const secret = process.env.SYNC_SECRET
  if (!base || !secret) return
  await fetch(new URL('/api/sync/revalidate', base), {
    method: 'POST',
    headers: { 'x-sync-secret': secret },
    signal: AbortSignal.timeout(5000),
  }).catch((e) => console.error('[mirror] could not refresh the classic site:', e?.message || e))
}

async function run(label, task) {
  try {
    if ((await task()) !== false) await refreshOtherSite()
  } catch (e) {
    console.error(`[mirror] ${label} failed:`, e?.message || e)
  }
}

// After a create or update. `model` is this site's model, used to store a new syncId.
export function mirrorSave(kind, model, item) {
  if (!SYNCED.includes(kind)) return
  return run(kind, async () => {
    const db = await mirrorDb()
    if (!db || !item) return false
    let syncId = item.syncId
    if (!syncId) {
      syncId = randomUUID()
      await model.updateOne({ _id: item._id }, { $set: { syncId } })
    }
    const col = db.collection(COLLECTION[kind])
    const { set, insert } = toClassic(kind, item)
    await col.updateOne(linkFilter(kind, syncId, NAME_OF[kind](item) || ''), {
      $set: { ...set, syncId },
      $setOnInsert: { ...insert, order: await nextOrder(col) },
    }, { upsert: true })
  })
}

export function mirrorDelete(kind, item) {
  if (!SYNCED.includes(kind)) return
  return run(`delete ${kind}`, async () => {
    const db = await mirrorDb()
    const name = item && NAME_OF[kind](item)
    if (!db || !item || (!item.syncId && !name)) return false
    const filter = item.syncId ? { syncId: item.syncId } : linkFilter(kind, '__none__', name)
    const res = await db.collection(COLLECTION[kind]).deleteOne(filter)
    return res.deletedCount > 0
  })
}
