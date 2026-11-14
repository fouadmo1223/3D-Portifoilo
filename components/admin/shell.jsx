'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Briefcase, ExternalLink, FolderKanban, Inbox, LayoutDashboard, Loader2, LogOut, Menu, SlidersHorizontal, Sparkles, UserRound, X } from 'lucide-react'
import { api, BUSY_EVENT } from './api'

const NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/projects', label: 'Projects', icon: FolderKanban },
  { href: '/admin/filters', label: 'Filters', icon: SlidersHorizontal },
  { href: '/admin/experience', label: 'Experience', icon: Briefcase },
  { href: '/admin/skills', label: 'Skills', icon: Sparkles },
  { href: '/admin/profile', label: 'Profile', icon: UserRound },
  { href: '/admin/messages', label: 'Messages', icon: Inbox },
]

export function AdminShell({ username, children }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  // Top progress bar: starts when an admin link is clicked, finishes when the route changes.
  const [travel, setTravel] = useState('idle') // idle | going | done
  const [target, setTarget] = useState(null) // sidebar link that was clicked and is still loading
  const [working, setWorking] = useState(0) // saves, deletes and uploads in flight
  const [leaving, setLeaving] = useState(false)
  useEffect(() => {
    setOpen(false)
    setTarget(null)
    setTravel((t) => (t === 'going' ? 'done' : t))
  }, [pathname])
  useEffect(() => {
    const onBusy = (e) => setWorking((n) => Math.max(0, n + e.detail))
    window.addEventListener(BUSY_EVENT, onBusy)
    return () => window.removeEventListener(BUSY_EVENT, onBusy)
  }, [])
  // The bar finishes when the last action ends, the same way it does for a page change.
  const [acting, setActing] = useState('idle')
  useEffect(() => {
    if (working > 0) { setActing('going'); return }
    setActing((a) => (a === 'going' ? 'done' : a))
    const t = setTimeout(() => setActing('idle'), 350)
    return () => clearTimeout(t)
  }, [working])
  const progress = travel === 'going' || acting === 'going' ? 'going' : travel === 'done' || acting === 'done' ? 'done' : 'idle'
  useEffect(() => {
    if (travel !== 'done') return
    const t = setTimeout(() => setTravel('idle'), 350)
    return () => clearTimeout(t)
  }, [travel])
  const onNavigate = (e) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const a = e.target.closest?.('a[href^="/admin"]')
    if (!a || a.target === '_blank' || a.getAttribute('href') === pathname) return
    setTravel('going')
    // Only sidebar links move the highlight; a card or "New" link keeps the current section lit.
    const href = a.getAttribute('href')
    setTarget(NAV.some((n) => n.href === href) ? href : null)
  }
  useEffect(() => {
    api('stats').then((s) => setUnread(s.unread)).catch(() => {})
  }, [pathname])

  const signOut = async () => {
    setLeaving(true)
    await api('logout', { method: 'POST' }).catch(() => {})
    router.replace('/admin/login')
    router.refresh()
  }

  return (
    <div dir="ltr" lang="en" onClickCapture={onNavigate} className="min-h-dvh bg-ink text-bone">
      <div aria-hidden="true" className={`admin-progress admin-progress-${progress}`} />
      <span role="status" className="sr-only">{travel === 'going' ? 'Loading page…' : working > 0 ? 'Saving…' : ''}</span>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-ink px-4 lg:hidden">
        <span className="font-mono text-sm text-accent">&lt;FM /&gt; <span className="text-mute">admin</span></span>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="admin-nav" aria-label={open ? 'Close menu' : 'Open menu'} className="admin-icon">
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      <aside id="admin-nav" className={`fixed inset-y-0 start-0 z-30 w-60 flex-col border-e border-line bg-ink pt-14 lg:flex lg:pt-0 ${open ? 'flex' : 'hidden'}`}>
        <div className="hidden h-16 items-center border-b border-line px-5 lg:flex">
          <span className="font-mono text-sm text-accent">&lt;FM /&gt; <span className="text-mute">admin</span></span>
        </div>
        <nav aria-label="Admin" className="flex-1 overflow-y-auto p-3">
          <ul className="space-y-1">
            {NAV.map(({ href, label, icon: Icon, exact }, i) => {
              // The clicked link lights up at once instead of waiting for the page to arrive.
              const active = target ? target === href : exact ? pathname === href : pathname.startsWith(href)
              const loading = target === href
              return (
                <li key={href} style={{ '--i': i }} className="admin-rise">
                  <Link href={href} aria-current={active ? 'page' : undefined} className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${active ? 'text-bone' : 'text-mute hover:bg-coal/60 hover:text-bone'}`}>
                    {active && <motion.span layoutId="admin-nav-marker" className="absolute inset-0 rounded-lg border border-line bg-coal before:absolute before:inset-y-2.5 before:start-0 before:w-0.5 before:rounded-full before:bg-accent" transition={{ type: 'spring', stiffness: 480, damping: 40 }} />}
                    {loading ? <Loader2 size={16} className="relative animate-spin text-accent" /> : <Icon size={16} className={`relative transition-colors ${active ? 'text-accent' : ''}`} />}
                    <span className="relative flex-1">{label}</span>
                    {label === 'Messages' && unread > 0 && <span className="relative rounded-full bg-accent px-1.5 py-0.5 font-mono text-[0.65rem] font-medium text-ink">{unread}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="border-t border-line p-3">
          <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-mute transition-colors hover:bg-coal/60 hover:text-bone"><ExternalLink size={16} />View site</a>
          <button type="button" onClick={signOut} disabled={leaving} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start text-sm text-mute transition-colors hover:bg-danger/10 hover:text-danger disabled:cursor-wait disabled:opacity-60">{leaving ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}{leaving ? 'Signing out…' : 'Sign out'}</button>
          <p className="truncate px-3 pt-2 font-mono text-[0.65rem] text-faint">Signed in as {username}</p>
        </div>
      </aside>

      <main className="lg:ps-60">
        <div key={pathname} className="admin-page mx-auto max-w-6xl px-5 py-8 lg:px-10 lg:py-12">{children}</div>
      </main>
    </div>
  )
}
