import { SignJWT, jwtVerify } from 'jose'

// Edge-safe session helpers (used by proxy.js and route handlers).
export const SESSION_COOKIE = 'p3d_session'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7

function secret() {
  const value = process.env.JWT_SECRET
  if (!value || value.length < 32) throw new Error('JWT_SECRET must be set (32+ characters).')
  return new TextEncoder().encode(value)
}

export function createSessionToken(username) {
  return new SignJWT({ sub: username, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret())
}

export async function verifySessionToken(token) {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] })
    return payload.role === 'admin' ? payload : null
  } catch {
    return null
  }
}

export const sessionCookie = (token) => ({
  name: SESSION_COOKIE,
  value: token,
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: token ? SESSION_MAX_AGE : 0,
})
