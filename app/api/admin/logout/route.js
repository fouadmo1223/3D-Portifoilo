import { cookies } from 'next/headers'
import { handle, json } from '@/lib/http'
import { sessionCookie } from '@/lib/session'

export const POST = handle(async () => {
  const store = await cookies()
  store.set(sessionCookie(''))
  return json({ ok: true })
})
