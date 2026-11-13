'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, Mail, MailOpen, Reply, Trash2 } from 'lucide-react'
import { api } from './api'
import { ListSkeleton, Skeleton } from './skeleton'

const when = (d) => new Date(d).toLocaleString('en', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export function Messages() {
  const [items, setItems] = useState(null)
  const [open, setOpen] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    api('messages?limit=200').then((d) => { if (alive) setItems(d.items) }).catch((err) => { if (alive) setError(err.message) })
    return () => { alive = false }
  }, [])

  const setRead = async (m, read) => {
    setItems((list) => list.map((x) => (x._id === m._id ? { ...x, read } : x)))
    try { await api(`messages/${m._id}`, { method: 'PATCH', body: { read } }) } catch (err) { setError(err.message) }
  }
  const toggleOpen = (m) => {
    const opening = open !== m._id
    setOpen(opening ? m._id : null)
    if (opening && !m.read) setRead(m, true)
  }
  const remove = async (m) => {
    if (!window.confirm(`Delete the message from ${m.name}? This cannot be undone.`)) return
    try {
      await api(`messages/${m._id}`, { method: 'DELETE' })
      setItems((list) => list.filter((x) => x._id !== m._id))
    } catch (err) { setError(err.message) }
  }

  const unread = items?.filter((m) => !m.read).length ?? 0

  return (
    <div className="mx-auto max-w-4xl">
      <div className="admin-rise">
        <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
        {items ? <p className="mt-1 text-sm text-mute">{`${items.length} total${unread ? ` · ${unread} unread` : ''}`}</p> : <Skeleton className="mt-2.5 h-3 w-24" />}
      </div>

      {error && <p role="alert" className="mt-5 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

      {!items ? (
        <ListSkeleton single rows={6} label="Loading messages…" className="mt-6" />
      ) : items.length === 0 ? (
        <p className="admin-rise admin-card mt-8 border-dashed px-6 py-16 text-center text-sm text-mute" style={{ '--i': 1 }}>No messages yet. They arrive from the contact form on your site.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((m, i) => {
            const isOpen = open === m._id
            return (
              <li key={m._id} style={{ '--i': Math.min(i, 14) + 1 }} className={`admin-rise admin-card overflow-hidden ${isOpen ? '!border-line-strong' : 'admin-card-hover'}`}>
                <button type="button" onClick={() => toggleOpen(m)} aria-expanded={isOpen} className="flex w-full items-center gap-3 px-4 py-3.5 text-start">
                  <span className={`grid size-9 shrink-0 place-items-center rounded-full font-mono text-xs uppercase ${m.read ? 'bg-ash text-mute' : 'bg-accent/15 text-accent'}`} aria-hidden="true">{(m.name || '?').slice(0, 1)}</span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm ${m.read ? 'text-bone/70' : 'font-medium text-bone'}`}>{m.subject}{!m.read && <span className="sr-only"> (unread)</span>}</span>
                    <span className="block truncate text-xs text-mute">{m.name} · {m.email}</span>
                  </span>
                  <time dateTime={m.createdAt} className="hidden shrink-0 font-mono text-[0.7rem] text-faint sm:block">{when(m.createdAt)}</time>
                  <ChevronDown size={15} className={`shrink-0 text-faint transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="admin-swap border-t border-line bg-coal/30 px-4 py-5 sm:ps-16">
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-bone/90">{m.message}</p>
                    <p className="mt-4 font-mono text-[0.7rem] text-faint sm:hidden">{when(m.createdAt)}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`} className="admin-btn admin-btn-primary"><Reply size={14} />Reply by email</a>
                      <button type="button" onClick={() => setRead(m, !m.read)} className="admin-btn">{m.read ? <Mail size={14} /> : <MailOpen size={14} />}{m.read ? 'Mark unread' : 'Mark read'}</button>
                      <button type="button" onClick={() => remove(m)} className="admin-btn hover:!border-danger hover:!text-danger"><Trash2 size={14} />Delete</button>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
