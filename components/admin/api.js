// Thin fetch wrapper for the admin API: JSON in, JSON out, errors as exceptions
// carrying the server's message and per-field problems.
export class RequestError extends Error {
  constructor(message, status, fields) {
    super(message)
    this.status = status
    this.fields = fields ?? {}
  }
}

// Every save, delete, toggle and upload reports in here, so the shell can show a progress bar
// for actions the same way it does for page changes.
export const BUSY_EVENT = 'admin:busy'
const announce = (delta) => { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(BUSY_EVENT, { detail: delta })) }

export async function api(path, options = {}) {
  const changing = (options.method ?? 'GET') !== 'GET'
  if (changing) announce(1)
  try {
    return await request(path, options)
  } finally {
    if (changing) announce(-1)
  }
}

async function request(path, { method = 'GET', body, form } = {}) {
  let res
  try {
    res = await fetch(`/api/admin/${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: form ?? (body ? JSON.stringify(body) : undefined),
      credentials: 'same-origin',
    })
  } catch {
    throw new RequestError('Could not reach the server. Check your connection.', 0)
  }
  const data = await res.json().catch(() => ({}))
  if (res.status === 401 && path !== 'login') {
    window.location.assign(`/admin/login?next=${encodeURIComponent(window.location.pathname)}`)
    throw new RequestError('Your session expired. Sign in again.', 401)
  }
  if (!res.ok) throw new RequestError(data.error || `Request failed (${res.status}).`, res.status, data.fields)
  return data
}

// Read and immutably write nested values by dotted path ("title.en", "education.0.place.ar").
export const getPath = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj)

export function setPath(obj, path, value) {
  const [head, ...rest] = path.split('.')
  const base = Array.isArray(obj) ? [...obj] : { ...(obj ?? {}) }
  base[head] = rest.length ? setPath(base[head] ?? (/^\d+$/.test(rest[0]) ? [] : {}), rest.join('.'), value) : value
  return base
}
