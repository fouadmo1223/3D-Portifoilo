import connectDB from '@/lib/db'
import { handle, json, readJson } from '@/lib/http'
import { requireAdmin } from '@/lib/auth'
import { refreshSite } from '@/lib/resources'
import { schemas } from '@/lib/validators'
import PersonalInfo from '@/models/PersonalInfo'

export const dynamic = 'force-dynamic'

export const GET = handle(async () => {
  await requireAdmin()
  await connectDB()
  return json({ item: await PersonalInfo.findOne().lean() })
})

// Single document: create on first save, update afterwards.
export const PUT = handle(async (req) => {
  await requireAdmin()
  const data = schemas.profile.parse(await readJson(req))
  await connectDB()
  const item = await PersonalInfo.findOneAndUpdate({}, data, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }).lean()
  refreshSite()
  return json({ item })
})
