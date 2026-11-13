'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Loader2, Plus } from 'lucide-react'
import { api } from './api'

const when = (d) => new Date(d).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })

export function Overview() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let alive = true
    api('stats').then((s) => { if (alive) setStats(s) }).catch((err) => { if (alive) setError(err.message) })
    return () => { alive = false }
  }, [])

  if (error) return <p role="alert" className="border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>
  if (!stats) return <p className="flex items-center gap-2 py-16 text-sm text-mute"><Loader2 size={15} className="animate-spin" />Loading overview…</p>

  const cards = [
    { href: '/admin/projects', label: 'Projects', value: stats.projects, note: `${stats.published} published · ${stats.featured} featured` },
    { href: '/admin/experience', label: 'Experience', value: stats.experience, note: 'roles on the timeline' },
    { href: '/admin/skills', label: 'Skills', value: stats.skills, note: 'in the skill ring' },
    { href: '/admin/messages', label: 'Messages', value: stats.messages, note: stats.unread ? `${stats.unread} unread` : 'all read', hot: stats.unread > 0 },
  ]

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
      <p className="mt-1 text-sm text-mute">Changes you save here appear on the site straight away.</p>

      <ul className="mt-8 grid gap-px border border-line bg-line sm:grid-cols-2">
        {cards.map((c) => (
          <li key={c.href}>
            <Link href={c.href} className="group flex h-full items-start justify-between gap-4 bg-ink p-5 transition-colors hover:bg-coal">
              <span>
                <span className="block font-mono text-[0.7rem] uppercase tracking-widest text-mute">{c.label}</span>
                <span className="mt-2 block text-4xl font-semibold tabular-nums tracking-tight">{c.value}</span>
                <span className={`mt-1 block text-xs ${c.hot ? 'text-accent' : 'text-mute'}`}>{c.note}</span>
              </span>
              <ArrowUpRight size={16} className="text-faint transition-colors group-hover:text-accent" />
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/admin/projects/new" className="admin-btn"><Plus size={14} />New project</Link>
        <Link href="/admin/experience/new" className="admin-btn"><Plus size={14} />New role</Link>
        <Link href="/admin/skills/new" className="admin-btn"><Plus size={14} />New skill</Link>
      </div>

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-mono text-[0.7rem] uppercase tracking-widest text-mute">Latest messages</h2>
          <Link href="/admin/messages" className="text-xs text-mute hover:text-bone">View all</Link>
        </div>
        {stats.latest.length === 0 ? (
          <p className="border border-dashed border-line px-5 py-10 text-center text-sm text-mute">No messages yet. They arrive from the contact form.</p>
        ) : (
          <ul className="border border-line">
            {stats.latest.map((m) => (
              <li key={m._id} className="border-b border-line last:border-b-0">
                <Link href="/admin/messages" className="flex items-center gap-3 px-4 py-3 hover:bg-coal/50">
                  <span className={`size-1.5 shrink-0 rounded-full ${m.read ? 'bg-transparent' : 'bg-accent'}`} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm ${m.read ? 'text-bone/70' : 'font-medium text-bone'}`}>{m.subject}</span>
                    <span className="block truncate text-xs text-mute">{m.name} · {m.email}</span>
                  </span>
                  <time dateTime={m.createdAt} className="shrink-0 font-mono text-[0.7rem] text-faint">{when(m.createdAt)}</time>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
