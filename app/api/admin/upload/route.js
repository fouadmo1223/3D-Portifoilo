import { handle, json, ApiError } from '@/lib/http'
import { requireAdmin } from '@/lib/auth'
import { storeImage } from '@/lib/upload'

export const runtime = 'nodejs'

export const POST = handle(async (req) => {
  await requireAdmin()
  const length = Number(req.headers.get('content-length') || 0)
  if (length > 9 * 1024 * 1024) throw new ApiError(413, 'Images must be 8 MB or smaller.')
  const form = await req.formData()
  return json(await storeImage(form.get('file')), { status: 201 })
})
