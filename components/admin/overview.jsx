'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Briefcase, ChevronRight, FolderKanban, Inbox, Plus, Sparkles, UserRound } from 'lucide-react'
import { api } from './api'
import { OverviewSkeleton } from './skeleton'

const when = (d) => new Date(d).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })

// Counts up to the value once, when the card appears.
function Count({ to }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!to || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setN(to); return }
    let raf
    const start = performance.now()
    const tick = (now) => {
      const p = Math.min(1, (now - start) / 700)
      setN(Math.round(to * (1 - (1 - p) ** 3)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [to])
  return n
}

const SHORTCUTS = [
  { href: '/admin/projects/new', label: 'New project', note: 'Add work to the reel', icon: FolderKanban },
  { href: '/admin/experience/new', label: 'New role', note: 'Extend the timeline', icon: Briefcase },
  { href: '/admin/skills/new', label: 'New skill', note: 'Add to the skill ring', icon: Sparkles },
  { href: '/admin/profile', label: 'Edit profile', note: 'Bio, links and contact', icon: UserRound, plain: true },
]

export function Overview() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let alive = true
    api('stats').then((s) => { if (alive) setStats(s) }).catch((err) => { if (alive) setError(err.message) })
    return () => { alive = false }
  }, [])

  if (error) return <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>
  const intro = (
    <div className="admin-rise">
      <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
      <p className="mt-1 text-sm text-mute">Changes you save here appear on the site straight away.</p>
    </div>
  )
  if (!stats) return <div>{intro}<OverviewSkeleton /></div>

  const cards = [
    { href: '/admin/projects', label: 'Projects', icon: FolderKanban, value: stats.projects, note: `${stats.published} published · ${stats.featured} featured` },
    { href: '/admin/experience', label: 'Experience', icon: Briefcase, value: stats.experience, note: 'roles on the timeline' },
    { href: '/admin/skills', label: 'Skills', icon: Sparkles, value: stats.skills, note: 'in the skill ring' },
    { href: '/admin/messages', label: 'Messages', icon: Inbox, value: stats.messages, note: stats.unread ? `${stats.unread} unread` : 'all read', hot: stats.unread > 0 },
  ]

  return (
    <div>
      {intro}

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ icon: Icon, ...c }, i) => (
          <li key={c.href} style={{ '--i': i + 1 }} className="admin-rise">
            <Link href={c.href} className="admin-card admin-card-hover admin-card-glow group relative flex h-full flex-col overflow-hidden p-5">
              <span className="flex items-start justify-between">
                <span className="grid size-9 place-items-center rounded-lg border border-accent/20 bg-accent/10 text-accent"><Icon size={16} /></span>
                <ArrowUpRight size={16} className="text-faint transition-[color,transform] duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
              </span>
              <span className="mt-5 block text-4xl font-semibold tabular-nums tracking-tight"><Count to={c.value} /></span>
              <span className="mt-2 block font-mono text-[0.7rem] uppercase tracking-widest text-mute">{c.label}</span>
              <span className={`mt-1 flex items-center gap-1.5 text-xs ${c.hot ? 'text-accent' : 'text-faint'}`}>
                {c.hot && <span className="size-1.5 rounded-full bg-accent animate-pulse-dot" aria-hidden="true" />}
                {c.note}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_1.6fr]">
        <section className="admin-rise admin-card p-5" style={{ '--i': 5 }}>
          <h2 className="font-mono text-[0.7rem] uppercase tracking-widest text-mute">Shortcuts</h2>
          <ul className="mt-3 space-y-1.5">
            {SHORTCUTS.map(({ href, label, note, icon: Icon, plain }) => (
              <li key={href}>
                <Link href={href} className="group flex items-center gap-3 rounded-lg border border-transparent px-2.5 py-2 transition-colors hover:border-line hover:bg-coal">
                  <span className="grid size-8 shrink-0 place-items-center rounded-md bg-ash text-mute transition-colors group-hover:text-accent">{plain ? <Icon size={15} /> : <Plus size={15} />}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-bone">{label}</span>
                    <span className="block truncate text-xs text-mute">{note}</span>
                  </span>
                  <ChevronRight size={15} className="text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-bone" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="admin-rise admin-card p-5" style={{ '--i': 6 }}>
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-[0.7rem] uppercase tracking-widest text-mute">Latest messages</h2>
            <Link href="/admin/messages" className="text-xs text-mute hover:text-bone">View all</Link>
          </div>
          {stats.latest.length === 0 ? (
            <div className="mt-3 grid place-items-center rounded-lg border border-dashed border-line px-5 py-12 text-center">
              <span className="grid size-10 place-items-center rounded-full bg-ash text-mute"><Inbox size={17} /></span>
              <p className="mt-3 text-sm text-bone">No messages yet</p>
              <p className="mt-1 text-xs text-mute">They arrive from the contact form on your site.</p>
            </div>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {stats.latest.map((m) => (
                <li key={m._id}>
                  <Link href="/admin/messages" className="flex items-center gap-3 rounded-lg border border-transparent px-2.5 py-2 transition-colors hover:border-line hover:bg-coal">
                    <span className={`grid size-8 shrink-0 place-items-center rounded-full font-mono text-xs uppercase ${m.read ? 'bg-ash text-mute' : 'bg-accent/15 text-accent'}`} aria-hidden="true">{(m.name || '?').slice(0, 1)}</span>
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
    </div>
  )
}
