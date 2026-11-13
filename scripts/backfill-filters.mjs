// Restores each project's stack groups (react, next, php…) from the old portfolio database,
// where they lived in a space-separated `category` string. Matches projects by English title.
//
//   node --env-file=.env.local scripts/backfill-filters.mjs
//
// Only the `filters` field of the new database is written; the old database is read-only here.
import { readFileSync } from 'node:fs'
import mongoose from 'mongoose'

const KEYS = ['react', 'html', 'next', 'php', 'node', 'nest', 'zid', 'astro', 'reactnative']

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
if (!NEW_URI || !OLD_URI || NEW_URI === OLD_URI) {
  console.error('Need two different URIs: MONGODB_URI (new) and OLD_MONGODB_URI or OLD_ENV_FILE (old).')
  process.exit(1)
}

const norm = (s = '') => s.trim().toLowerCase().replace(/\s+/g, ' ')

const oldConn = await mongoose.createConnection(OLD_URI, { serverSelectionTimeoutMS: 15000 }).asPromise()
const newConn = await mongoose.createConnection(NEW_URI, { serverSelectionTimeoutMS: 15000 }).asPromise()
try {
  const old = await oldConn.db.collection('projects').find({}, { projection: { title: 1, category: 1 } }).toArray()
  const byTitle = new Map(old.map((p) => [norm(p.title), (p.category || '').toLowerCase().split(/\s+/).filter((k) => KEYS.includes(k))]))
  const projects = newConn.db.collection('projects')
  const current = await projects.find({}, { projection: { 'title.en': 1 } }).toArray()

  let matched = 0
  const missing = []
  for (const p of current) {
    const filters = byTitle.get(norm(p.title?.en))
    if (!filters) { missing.push(p.title?.en); continue }
    await projects.updateOne({ _id: p._id }, { $set: { filters } })
    matched += 1
  }
  const counts = Object.fromEntries(KEYS.map((k) => [k, 0]))
  for (const f of byTitle.values()) for (const k of f) counts[k] += 1
  console.log(`Updated ${matched} of ${current.length} projects.`)
  console.log('Old counts per group:', JSON.stringify(counts))
  if (missing.length) console.log(`No match in the old database for: ${missing.join(', ')}`)
} finally {
  await oldConn.close()
  await newConn.close()
}
