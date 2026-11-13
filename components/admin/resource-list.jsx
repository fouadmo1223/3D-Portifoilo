'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react'
import { api } from './api'
import { RESOURCES } from './config'

export function ResourceList({ resource }) {
  const cfg = RESOURCES[resource]
  const [items, setItems] = useState(null)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(null) // id being changed
  const request = useRef(0)

  const load = useCallback(async (q) => {
    const mine = ++request.current
    try {
      const data = await api(`${resource}?limit=200${q ? `&q=${encodeURIComponent(q)}` : ''}`)
      if (mine === request.current) { setItems(data.items); setError('') }
    } catch (err) {
      if (mine === request.current) setError(err.message)
    }
  }, [resource])

  useEffect(() => {
    const t = setTimeout(() => load(query.trim()), query ? 250 : 0)
    return () => clearTimeout(t)
  }, [query, load])

  const act = async (id, fn) => {
    setBusy(id)
    setError('')
    try { await fn() } catch (err) { setError(err.message); load(query.trim()) } finally { setBusy(null) }
  }

  const toggle = (item, key) => act(item._id, async () => {
    setItems((list) => list.map((x) => (x._id === item._id ? { ...x, [key]: !x[key] } : x)))
    await api(`${resource}/${item._id}`, { method: 'PATCH', body: { [key]: !item[key] } })
  })

  const reorder = (index, by) => act(items[index]._id, async () => {
    const next = [...items]
    const [moved] = next.splice(index, 1)
    next.splice(index + by, 0, moved)
    setItems(next)
    await api(`${resource}/reorder`, { method: 'POST', body: { ids: next.map((x) => x._id) } })
  })

  const remove = (item) => {
    if (!window.confirm(`Delete "${cfg.title(item)}"? This cannot be undone.`)) return
    act(item._id, async () => {
      await api(`${resource}/${item._id}`, { method: 'DELETE' })
      setItems((list) => list.filter((x) => x._id !== item._id))
    })
  }

  const searching = query.trim().length > 0

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{cfg.label}</h1>
          <p className="mt-1 text-sm text-mute">{items ? `${items.length} ${items.length === 1 ? 'item' : 'items'}${searching ? ' found' : ''}` : 'Loading…'}</p>
        </div>
        <Link href={`/admin/${resource}/new`} className="admin-btn admin-btn-primary"><Plus size={14} />New {cfg.singular}</Link>
      </div>

      <div className="relative mb-4">
        <Search size={14} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-faint" />
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${cfg.label.toLowerCase()}`} aria-label={`Search ${cfg.label.toLowerCase()}`} className="admin-input !ps-9" />
      </div>

      {error && <p role="alert" className="mb-4 border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

      {!items ? (
        <p className="flex items-center gap-2 py-16 text-sm text-mute"><Loader2 size={15} className="animate-spin" />Loading {cfg.label.toLowerCase()}…</p>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-line px-6 py-16 text-center">
          <p className="text-bone">{searching ? `Nothing matches "${query.trim()}".` : `No ${cfg.label.toLowerCase()} yet.`}</p>
          {!searching && <Link href={`/admin/${resource}/new`} className="admin-btn admin-btn-primary mt-5"><Plus size={14} />Add the first {cfg.singular}</Link>}
        </div>
      ) : (
        <ul className="border border-line">
          {items.map((item, i) => {
            const image = cfg.image?.(item)
            const waiting = busy === item._id
            return (
              <li key={item._id} className={`flex items-center gap-3 border-b border-line px-3 py-2.5 last:border-b-0 hover:bg-coal/50 ${item.published === false ? 'opacity-60' : ''}`}>
                <span className="flex flex-col">
                  <button type="button" disabled={searching || i === 0 || waiting} onClick={() => reorder(i, -1)} aria-label="Move up" title={searching ? 'Clear the search to reorder' : 'Move up'} className="admin-icon !p-0.5"><ArrowUp size={13} /></button>
                  <button type="button" disabled={searching || i === items.length - 1 || waiting} onClick={() => reorder(i, 1)} aria-label="Move down" title={searching ? 'Clear the search to reorder' : 'Move down'} className="admin-icon !p-0.5"><ArrowDown size={13} /></button>
                </span>
                {cfg.image && (
                  <span className="grid size-11 shrink-0 place-items-center overflow-hidden border border-line bg-coal">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {image ? <img src={image} alt="" loading="lazy" className="size-full object-cover" /> : null}
                  </span>
                )}
                <Link href={`/admin/${resource}/${item._id}`} className="min-w-0 flex-1 py-1">
                  <span className="block truncate text-sm font-medium text-bone">{cfg.title(item) || 'Untitled'}</span>
                  <span className="block truncate text-xs text-mute">{cfg.subtitle(item)}</span>
                </Link>
                <span className="flex shrink-0 items-center">
                  {cfg.toggles.includes('featured') && (
                    <button type="button" disabled={waiting} onClick={() => toggle(item, 'featured')} aria-pressed={Boolean(item.featured)} aria-label={item.featured ? 'Remove from featured' : 'Mark as featured'} title={item.featured ? 'Featured' : 'Not featured'} className={`admin-icon ${item.featured ? '!text-syn-orange' : ''}`}>
                      <Star size={15} fill={item.featured ? 'currentColor' : 'none'} />
                    </button>
                  )}
                  <button type="button" disabled={waiting} onClick={() => toggle(item, 'published')} aria-pressed={Boolean(item.published)} aria-label={item.published ? 'Unpublish' : 'Publish'} title={item.published ? 'Published' : 'Hidden'} className={`admin-icon ${item.published ? '!text-accent' : ''}`}>
                    {item.published ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                  <Link href={`/admin/${resource}/${item._id}`} aria-label={`Edit ${cfg.title(item)}`} title="Edit" className="admin-icon"><Pencil size={15} /></Link>
                  <button type="button" disabled={waiting} onClick={() => remove(item)} aria-label={`Delete ${cfg.title(item)}`} title="Delete" className="admin-icon hover:!text-danger"><Trash2 size={15} /></button>
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
