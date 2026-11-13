import connectDB from '@/lib/db'
import { handle, json, readJson, ApiError } from '@/lib/http'
import { requireAdmin } from '@/lib/auth'
import { getResource, refreshSite } from '@/lib/resources'
import { reorderSchema } from '@/lib/validators'

// POST { ids: [...] } — the array order becomes each item's `order`.
export const POST = handle(async (req, { params }) => {
  await requireAdmin()
  const { resource } = await params
  const { model, readOnly } = getResource(resource)
  if (readOnly) throw new ApiError(405, 'This resource cannot be reordered.')
  const { ids } = reorderSchema.parse(await readJson(req, 50_000))
  await connectDB()
  await model.bulkWrite(ids.map((id, order) => ({ updateOne: { filter: { _id: id }, update: { $set: { order } } } })))
  refreshSite()
  return json({ ok: true })
})
