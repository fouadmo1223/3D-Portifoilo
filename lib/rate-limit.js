// Per-instance fixed-window limiter. Fine for a portfolio; use a shared store
// (e.g. Upstash Redis) if the site ever runs on many server instances.
const buckets = new Map()

export function rateLimit(key, { limit, windowMs }) {
  const now = Date.now()
  if (buckets.size > 10_000) for (const [k, v] of buckets) if (v.reset <= now) buckets.delete(k)
  const bucket = buckets.get(key)
  if (!bucket || bucket.reset <= now) {
    buckets.set(key, { count: 1, reset: now + windowMs })
    return true
  }
  bucket.count += 1
  return bucket.count <= limit
}

export const clientIp = (req) =>
  req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'local'
