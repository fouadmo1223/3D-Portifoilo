'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { api } from './api'

// Only ever redirect back into the admin area.
const safeNext = (next) => (typeof next === 'string' && next.startsWith('/admin') && !next.startsWith('/admin/login') ? next : '/admin')

export function LoginForm({ next }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api('login', { method: 'POST', body: { username, password } })
      window.location.assign(safeNext(next))
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm border border-line bg-coal/40 p-7">
      <p className="font-mono text-sm text-accent">&lt;FM /&gt; <span className="text-mute">admin</span></p>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-1 text-sm text-mute">Manage the content on your portfolio.</p>

      <div className="mt-7 space-y-4">
        <div>
          <label htmlFor="username" className="mb-1.5 block text-[0.8rem] font-medium text-bone/90">Username</label>
          <input id="username" name="username" autoComplete="username" autoFocus required value={username} onChange={(e) => setUsername(e.target.value)} className="admin-input" />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-[0.8rem] font-medium text-bone/90">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="admin-input" />
        </div>
      </div>

      {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}

      <button type="submit" disabled={busy || !username || !password} className="admin-btn admin-btn-primary mt-6 w-full justify-center !py-2.5">
        {busy && <Loader2 size={14} className="animate-spin" />}
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
