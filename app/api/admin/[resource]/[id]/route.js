import connectDB from '@/lib/db'
import { handle, json, readJson, ApiError } from '@/lib/http'
import { requireAdmin } from '@/lib/auth'
import { getResource, refreshSite } from '@/lib/resources'
import { toggleSchema } from '@/lib/validators'
import { mirrorSave, mirrorDelete, mirrorMessage } from '@/lib/mirror'

export const dynamic = 'force-dynamic'

const validId = (id) => {
  if (!/^[a-f0-9]{24}$/.test(id)) throw new ApiError(400, 'Invalid id.')
  return id
}

export const GET = handle(async (_req, { params }) => {
  await requireAdmin()
  const { resource, id } = await params
  const { model } = getResource(resource)
  await connectDB()
  const item = await model.findById(validId(id)).lean()
  if (!item) throw new ApiError(404, 'Not found.')
  return json({ item })
})

// Full update from the edit form.
export const PUT = handle(async (req, { params }) => {
  await requireAdmin()
  const { resource, id } = await params
  const { model, schema, readOnly, prepare, afterUpdate } = getResource(resource)
  if (readOnly) throw new ApiError(405, 'This resource is read-only.')
  await connectDB()
  let data = schema.parse(await readJson(req))
  if (prepare) data = await prepare(data, validId(id))
  const before = afterUpdate ? await model.findById(validId(id)).lean() : null
  const item = await model.findByIdAndUpdate(validId(id), data, { new: true, runValidators: true }).lean()
  if (!item) throw new ApiError(404, 'Not found.')
  await afterUpdate?.(before, item)
  refreshSite()
  await mirrorSave(resource, model, item)
  return json({ item })
})

// Quick toggles from list views: published / featured / read.
export const PATCH = handle(async (req, { params }) => {
  await requireAdmin()
  const { resource, id } = await params
  const { model } = getResource(resource)
  const patch = toggleSchema.parse(await readJson(req, 1_000))
  const allowed = resource === 'messages' ? ['read'] : resource === 'projects' ? ['published', 'featured'] : ['published']
  if (Object.keys(patch).some((k) => !allowed.includes(k))) throw new ApiError(400, 'That field cannot be toggled here.')
  await connectDB()
  const item = await model.findByIdAndUpdate(validId(id), { $set: patch }, { new: true }).lean()
  if (!item) throw new ApiError(404, 'Not found.')
  if (resource !== 'messages') refreshSite()
  if ('featured' in patch) await mirrorSave(resource, model, item)
  if (resource === 'messages' && 'read' in patch) await mirrorMessage('read', item)
  return json({ item })
})

export const DELETE = handle(async (_req, { params }) => {
  await requireAdmin()
  const { resource, id } = await params
  const { model, afterDelete } = getResource(resource)
  await connectDB()
  const item = await model.findByIdAndDelete(validId(id)).lean()
  if (!item) throw new ApiError(404, 'Not found.')
  await afterDelete?.(item)
  if (resource !== 'messages') refreshSite()
  await mirrorDelete(resource, item)
  if (resource === 'messages') await mirrorMessage('delete', item)
  return json({ ok: true })
})
