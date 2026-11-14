import { timingSafeEqual } from 'crypto'
import { refreshSite } from '@/lib/resources'

export const dynamic = 'force-dynamic'

// Called by the classic portfolio after it mirrors a change into this site's database,
// so the cached pages show it straight away.
export async function POST(req) {
  const secret = process.env.SYNC_SECRET || ''
  const given = req.headers.get('x-sync-secret') || ''
  const ok = secret.length > 0 && given.length === secret.length && timingSafeEqual(Buffer.from(given), Buffer.from(secret))
  if (!ok) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  refreshSite()
  return Response.json({ ok: true })
}
