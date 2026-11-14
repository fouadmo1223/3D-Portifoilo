import connectDB from '@/lib/db'
import { handle, json, readJson, ApiError } from '@/lib/http'
import { requireAdmin } from '@/lib/auth'
import { getResource, refreshSite, escapeRegex } from '@/lib/resources'

export const dynamic = 'force-dynamic'

// GET /api/admin/:resource?page=1&limit=50&q=term
export const GET = handle(async (req, { params }) => {
  await requireAdmin()
  const { resource: name } = await params
  const { model, sort, search, ready } = getResource(name)
  const sp = req.nextUrl.searchParams
  const page = Math.max(1, Number.parseInt(sp.get('page') || '1', 10) || 1)
  const limit = Math.min(200, Math.max(1, Number.parseInt(sp.get('limit') || '100', 10) || 100))
  const q = (sp.get('q') || '').trim().slice(0, 80)
  const filter = q ? { $or: search.map((f) => ({ [f]: { $regex: escapeRegex(q), $options: 'i' } })) } : {}
  await connectDB()
  await ready?.()
  const [items, total] = await Promise.all([
    model.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    model.countDocuments(filter),
  ])
  return json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) })
})

export const POST = handle(async (req, { params }) => {
  await requireAdmin()
  const { resource: name } = await params
  const { model, schema, readOnly, ready, prepare } = getResource(name)
  if (readOnly) throw new ApiError(405, 'This resource cannot be created from the dashboard.')
  await connectDB()
  await ready?.()
  let data = schema.parse(await readJson(req))
  if (prepare) data = await prepare(data)
  if (data.order === 0) {
    const last = await model.findOne().sort({ order: -1 }).select('order').lean()
    data.order = (last?.order ?? -1) + 1
  }
  const item = await model.create(data)
  refreshSite()
  return json({ item }, { status: 201 })
})
