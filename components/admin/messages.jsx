'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, Loader2, Mail, MailOpen, Reply, Trash2 } from 'lucide-react'
import { api } from './api'

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
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
      <p className="mt-1 text-sm text-mute">{items ? `${items.length} total${unread ? ` · ${unread} unread` : ''}` : 'Loading…'}</p>

      {error && <p role="alert" className="mt-5 border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

      {!items ? (
        <p className="flex items-center gap-2 py-16 text-sm text-mute"><Loader2 size={15} className="animate-spin" />Loading messages…</p>
      ) : items.length === 0 ? (
        <p className="mt-8 border border-dashed border-line px-6 py-16 text-center text-sm text-mute">No messages yet. They arrive from the contact form on your site.</p>
      ) : (
        <ul className="mt-6 border border-line">
          {items.map((m) => {
            const isOpen = open === m._id
            return (
              <li key={m._id} className="border-b border-line last:border-b-0">
                <button type="button" onClick={() => toggleOpen(m)} aria-expanded={isOpen} className="flex w-full items-center gap-3 px-4 py-3 text-start hover:bg-coal/50">
                  <span className={`size-1.5 shrink-0 rounded-full ${m.read ? 'bg-transparent' : 'bg-accent'}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm ${m.read ? 'text-bone/70' : 'font-medium text-bone'}`}>{m.subject}{!m.read && <span className="sr-only"> (unread)</span>}</span>
                    <span className="block truncate text-xs text-mute">{m.name} · {m.email}</span>
                  </span>
                  <time dateTime={m.createdAt} className="hidden shrink-0 font-mono text-[0.7rem] text-faint sm:block">{when(m.createdAt)}</time>
                  <ChevronDown size={15} className={`shrink-0 text-faint transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="border-t border-line bg-coal/30 px-4 py-5 sm:ps-9">
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
