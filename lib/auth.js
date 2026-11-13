import 'server-only'
import { cookies } from 'next/headers'
import { createHash, timingSafeEqual } from 'node:crypto'
import { ApiError } from './http'
import { SESSION_COOKIE, verifySessionToken } from './session'

export async function getAdmin() {
  const store = await cookies()
  return verifySessionToken(store.get(SESSION_COOKIE)?.value)
}

// Defence in depth: proxy.js guards /api/admin, and every handler checks again.
export async function requireAdmin() {
  const admin = await getAdmin()
  if (!admin) throw new ApiError(401, 'Not signed in.')
  return admin
}

const sameText = (a, b) => {
  // Hash first so both buffers have equal length, then compare in constant time.
  const x = createHash('sha256').update(a).digest()
  const y = createHash('sha256').update(b).digest()
  return timingSafeEqual(x, y)
}

// Credential check against ADMIN_USERNAME / ADMIN_PASSWORD (plain values in the environment).
export async function checkCredentials(username, password) {
  const expectedUser = process.env.ADMIN_USERNAME || ''
  const expectedPassword = process.env.ADMIN_PASSWORD || ''
  if (!expectedUser || !expectedPassword) {
    throw new ApiError(503, 'Admin login is not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD.')
  }
  const passwordOk = sameText(password, expectedPassword)
  const userOk = sameText(username, expectedUser)
  return passwordOk && userOk
}
