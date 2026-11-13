import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export const json = (data, init) => NextResponse.json(data, init)

// Wraps a route handler so every failure becomes a consistent JSON error.
export function handle(fn) {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx)
    } catch (error) {
      if (error instanceof ApiError) return json({ error: error.message }, { status: error.status })
      if (error instanceof ZodError) {
        const fields = {}
        for (const issue of error.issues) fields[issue.path.join('.')] ??= issue.message
        return json({ error: 'Please fix the highlighted fields.', fields }, { status: 400 })
      }
      if (error?.code === 11000) return json({ error: 'That slug is already used by another item.' }, { status: 409 })
      if (error?.name === 'CastError') return json({ error: 'Invalid id.' }, { status: 400 })
      if (error?.name === 'ValidationError') return json({ error: error.message }, { status: 400 })
      console.error('[api]', error)
      return json({ error: 'Something went wrong on the server.' }, { status: 500 })
    }
  }
}

export async function readJson(req, limit = 200_000) {
  const raw = await req.text()
  if (raw.length > limit) throw new ApiError(413, 'Request too large.')
  try {
    return JSON.parse(raw || '{}')
  } catch {
    throw new ApiError(400, 'Invalid JSON.')
  }
}
