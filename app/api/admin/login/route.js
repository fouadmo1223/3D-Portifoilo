import { cookies } from 'next/headers'
import { handle, json, readJson, ApiError } from '@/lib/http'
import { loginSchema } from '@/lib/validators'
import { checkCredentials } from '@/lib/auth'
import { createSessionToken, sessionCookie } from '@/lib/session'
import { rateLimit, clientIp } from '@/lib/rate-limit'

export const POST = handle(async (req) => {
  if (!rateLimit(`login:${clientIp(req)}`, { limit: 8, windowMs: 15 * 60_000 })) {
    throw new ApiError(429, 'Too many attempts. Try again in 15 minutes.')
  }
  const { username, password } = loginSchema.parse(await readJson(req, 2_000))
  if (!(await checkCredentials(username, password))) throw new ApiError(401, 'Wrong username or password.')
  const store = await cookies()
  store.set(sessionCookie(await createSessionToken(username)))
  return json({ ok: true })
})
