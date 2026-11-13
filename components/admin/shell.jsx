'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Briefcase, ExternalLink, FolderKanban, Inbox, LayoutDashboard, LogOut, Menu, Sparkles, UserRound, X } from 'lucide-react'
import { api } from './api'

const NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/projects', label: 'Projects', icon: FolderKanban },
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

  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => {
    api('stats').then((s) => setUnread(s.unread)).catch(() => {})
  }, [pathname])

  const signOut = async () => {
    await api('logout', { method: 'POST' }).catch(() => {})
    router.replace('/admin/login')
    router.refresh()
  }

  return (
    <div dir="ltr" lang="en" className="min-h-dvh bg-ink text-bone">
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
          <ul className="space-y-0.5">
            {NAV.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href)
              return (
                <li key={href}>
                  <Link href={href} aria-current={active ? 'page' : undefined} className={`flex items-center gap-3 border-s-2 px-3 py-2.5 text-sm transition-colors ${active ? 'border-accent bg-coal text-bone' : 'border-transparent text-mute hover:bg-coal/60 hover:text-bone'}`}>
                    <Icon size={16} className={active ? 'text-accent' : ''} />
                    <span className="flex-1">{label}</span>
                    {label === 'Messages' && unread > 0 && <span className="bg-accent px-1.5 py-0.5 font-mono text-[0.65rem] font-medium text-ink">{unread}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="border-t border-line p-3">
          <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-3 py-2.5 text-sm text-mute hover:text-bone"><ExternalLink size={16} />View site</a>
          <button type="button" onClick={signOut} className="flex w-full items-center gap-3 px-3 py-2.5 text-start text-sm text-mute hover:text-danger"><LogOut size={16} />Sign out</button>
          <p className="truncate px-3 pt-2 font-mono text-[0.65rem] text-faint">Signed in as {username}</p>
        </div>
      </aside>

      <main className="lg:ps-60">
        <div className="mx-auto max-w-4xl px-5 py-8 lg:px-10 lg:py-12">{children}</div>
      </main>
    </div>
  )
}
