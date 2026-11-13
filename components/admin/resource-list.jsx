'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Eye, EyeOff, ImageOff, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react'
import { api } from './api'
import { RESOURCES } from './config'
import { ListSkeleton, Skeleton } from './skeleton'

// Ask Cloudinary for a small version instead of the full-size upload.
const thumb = (src, w) => (src.includes('res.cloudinary.com') && /\/upload\/v\d+\//.test(src) ?src.replace('/upload/', `/upload/f_auto,q_auto,c_limit,w_${w}/`) : src)

export function ResourceList({ resource }) {
  const cfg = RESOURCES[resource]
  const grid = cfg.layout === 'grid' // picture cards; otherwise compact cards
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
  const Earlier = grid ? ArrowLeft : ArrowUp
  const Later = grid ? ArrowRight : ArrowDown

  // The buttons every card shares.
  const order = (i, waiting) => (
    <span className={`flex ${grid ? '' : 'flex-col'}`}>
      <button type="button" disabled={searching || i === 0 || waiting} onClick={() => reorder(i, -1)} aria-label="Move earlier" title={searching ? 'Clear the search to reorder' : 'Move earlier'} className={`admin-icon ${grid ? '' : '!p-0.5'}`}><Earlier size={grid ? 15 : 13} /></button>
      <button type="button" disabled={searching || i === items.length - 1 || waiting} onClick={() => reorder(i, 1)} aria-label="Move later" title={searching ? 'Clear the search to reorder' : 'Move later'} className={`admin-icon ${grid ? '' : '!p-0.5'}`}><Later size={grid ? 15 : 13} /></button>
    </span>
  )
  const actions = (item, waiting) => (
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
  )

  return (
    <div>
      <div className="admin-rise mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{cfg.label}</h1>
          {items ? <p className="mt-1 text-sm text-mute">{`${items.length} ${items.length === 1 ? 'item' : 'items'}${searching ? ' found' : ''}`}</p> : <Skeleton className="mt-2.5 h-3 w-16" />}
        </div>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
          <div className="relative w-full sm:w-72">
            <Search size={14} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-faint" />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${cfg.label.toLowerCase()}`} aria-label={`Search ${cfg.label.toLowerCase()}`} className="admin-input !ps-9" />
          </div>
          <Link href={`/admin/${resource}/new`} className="admin-btn admin-btn-primary !py-2.5"><Plus size={14} />New {cfg.singular}</Link>
        </div>
      </div>

      {error && <p role="alert" className="mb-4 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

      {!items ? (
        <ListSkeleton grid={grid} rows={grid ? 6 : 8} image={Boolean(cfg.image)} label={`Loading ${cfg.label.toLowerCase()}…`} />
      ) : items.length === 0 ? (
        <div className="admin-rise admin-card border-dashed px-6 py-16 text-center">
          <p className="text-bone">{searching ? `Nothing matches "${query.trim()}".` : `No ${cfg.label.toLowerCase()} yet.`}</p>
          {!searching && <Link href={`/admin/${resource}/new`} className="admin-btn admin-btn-primary mt-5"><Plus size={14} />Add the first {cfg.singular}</Link>}
        </div>
      ) : grid ? (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item, i) => {
            const image = cfg.image?.(item)
            const waiting = busy === item._id
            const hidden = item.published === false
            return (
              <li key={item._id} style={{ '--i': Math.min(i, 11) + 1 }} className="admin-rise admin-card admin-card-hover group flex flex-col overflow-hidden">
                <Link href={`/admin/${resource}/${item._id}`} tabIndex={-1} aria-hidden="true" className="relative block aspect-[16/10] overflow-hidden bg-coal">
                  {image
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={thumb(image, 720)} alt="" loading="lazy" className={`size-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.06] ${hidden ? 'opacity-40 grayscale' : ''}`} />
                    : <span className="grid size-full place-items-center text-faint"><ImageOff size={22} /></span>}
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/10 to-transparent" />
                  <span className="admin-chip absolute start-3 top-3">{String(i + 1).padStart(2, '0')}</span>
                  <span className="absolute end-3 top-3 flex gap-1.5">
                    {item.featured && <span className="admin-chip !text-syn-orange"><Star size={10} fill="currentColor" />Featured</span>}
                    {hidden && <span className="admin-chip"><EyeOff size={10} />Hidden</span>}
                  </span>
                </Link>
                <div className="flex flex-1 flex-col px-4 pb-2 pt-3.5">
                  <Link href={`/admin/${resource}/${item._id}`} className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-bone transition-colors group-hover:text-accent">{cfg.title(item) || 'Untitled'}</span>
                    <span className="mt-0.5 block truncate text-xs text-mute">{cfg.subtitle(item)}</span>
                  </Link>
                  <div className="mt-3 flex items-center justify-between border-t border-line pt-1.5">
                    {order(i, waiting)}
                    {actions(item, waiting)}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {items.map((item, i) => {
            const image = cfg.image?.(item)
            const waiting = busy === item._id
            return (
              <li key={item._id} style={{ '--i': Math.min(i, 14) + 1 }} className={`admin-rise admin-card admin-card-hover group flex items-center gap-3 px-3 py-3 ${item.published === false ? 'admin-dim' : ''}`}>
                {order(i, waiting)}
                <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-coal font-mono text-xs text-mute">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {image ? <img src={thumb(image, 96)} alt="" loading="lazy" className="size-full object-contain p-1.5" /> : (cfg.title(item) || '?').slice(0, 2).toUpperCase()}
                </span>
                <Link href={`/admin/${resource}/${item._id}`} className="min-w-0 flex-1 py-1">
                  <span className="block truncate text-sm font-medium text-bone transition-colors group-hover:text-accent">{cfg.title(item) || 'Untitled'}</span>
                  <span className="block truncate text-xs text-mute">{cfg.subtitle(item)}</span>
                </Link>
                {actions(item, waiting)}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
