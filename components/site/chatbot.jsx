'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { ArrowUp, GripVertical, X } from 'lucide-react'
import { isSafeUrl } from '@/lib/url'
import { useLocale } from './locale-provider'

// Minimal, safe Markdown: **bold**, [links](url) and "- " lists. No HTML injection.
function renderInline(text, keyBase) {
  const parts = []
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g
  let last = 0
  let m
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    if (m[1]) parts.push(<strong key={`${keyBase}-${m.index}`} className="font-semibold text-bone">{m[1]}</strong>)
    else if (isSafeUrl(m[3])) parts.push(<a key={`${keyBase}-${m.index}`} href={m[3]} target={m[3].startsWith('/') ? undefined : '_blank'} rel="noreferrer" className="text-accent underline underline-offset-2">{m[2]}</a>)
    else parts.push(m[2])
    last = re.lastIndex
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

function Markdown({ text }) {
  const blocks = text.split(/\n{2,}/)
  return blocks.map((block, bi) => {
    const lines = block.split('\n')
    if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
      return <ul key={bi} className="my-2 space-y-1">{lines.map((l, li) => <li key={li} className="flex gap-2"><span className="text-accent">—</span><span>{renderInline(l.replace(/^\s*[-*]\s+/, ''), `${bi}-${li}`)}</span></li>)}</ul>
    }
    return <p key={bi} className="my-2 first:mt-0 last:mb-0">{lines.map((l, li) => <Fragment key={li}>{li > 0 && <br />}{renderInline(l, `${bi}-${li}`)}</Fragment>)}</p>
  })
}

const STORE = 'p3d_chat_pos'
const MARGIN = 12

// Lets the launcher be dragged anywhere on screen. The position is an offset from its
// home corner, kept inside the viewport and remembered between visits. A press that
// barely moves still counts as a click.
function useDraggable(box) {
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [corner, setCorner] = useState({ up: true, end: true, room: 560 }) // where the panel has room to open, and how tall it may be
  const drag = useRef(null)
  const moved = useRef(false)

  const settle = (next) => {
    const el = box.current
    if (!el) return next
    // Measure where the launcher would land, then pull it back inside the viewport.
    const r = el.getBoundingClientRect()
    const dx = next.x - offsetRef.current.x
    const dy = next.y - offsetRef.current.y
    const left = r.left + dx
    const top = r.top + dy
    const cx = Math.min(Math.max(left, MARGIN), window.innerWidth - r.width - MARGIN)
    const cy = Math.min(Math.max(top, MARGIN), window.innerHeight - r.height - MARGIN)
    const up = cy + r.height / 2 > window.innerHeight / 2
    setCorner({
      up,
      end: (document.documentElement.dir === 'rtl') !== (cx + r.width / 2 > window.innerWidth / 2),
      room: Math.max(220, (up ? cy : window.innerHeight - cy - r.height) - 28),
    })
    return { x: next.x + (cx - left), y: next.y + (cy - top) }
  }
  const offsetRef = useRef(offset)
  const apply = (next) => { offsetRef.current = next; setOffset(next) }

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || 'null')
      if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) requestAnimationFrame(() => apply(settle(saved)))
    } catch {}
    const onResize = () => apply(settle(offsetRef.current))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlers = {
    onPointerDown: (e) => {
      if (e.button !== 0) return
      drag.current = { x: e.clientX, y: e.clientY, from: offsetRef.current }
      moved.current = false
      // Capture straight away so a fast drag that outruns the button still tracks.
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    onPointerMove: (e) => {
      const d = drag.current
      if (!d) return
      const dx = e.clientX - d.x
      const dy = e.clientY - d.y
      if (!moved.current && Math.hypot(dx, dy) < 6) return
      moved.current = true
      apply(settle({ x: d.from.x + dx, y: d.from.y + dy }))
    },
    onPointerUp: () => {
      if (drag.current && moved.current) {
        try { localStorage.setItem(STORE, JSON.stringify(offsetRef.current)) } catch {}
      }
      drag.current = null
    },
    onPointerCancel: () => { drag.current = null },
    // Arrow keys move it too, for keyboard users.
    onKeyDown: (e) => {
      const step = { ArrowLeft: [-24, 0], ArrowRight: [24, 0], ArrowUp: [0, -24], ArrowDown: [0, 24] }[e.key]
      if (!step || !e.shiftKey) return
      e.preventDefault()
      const next = settle({ x: offsetRef.current.x + step[0], y: offsetRef.current.y + step[1] })
      apply(next)
      try { localStorage.setItem(STORE, JSON.stringify(next)) } catch {}
    },
  }
  // Swallow the click that ends a drag so it does not toggle the panel.
  const wasDragged = () => { const m = moved.current; moved.current = false; return m }
  return { offset, corner, handlers, wasDragged }
}

export function Chatbot() {
  const { t } = useLocale()
  const [configured, setConfigured] = useState(false)
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const list = useRef(null)
  const field = useRef(null)
  const launcher = useRef(null)
  const { offset, corner, handlers, wasDragged } = useDraggable(launcher)

  useEffect(() => {
    fetch('/api/chat/status').then((r) => r.json()).then((d) => setConfigured(Boolean(d.configured))).catch(() => {})
  }, [])

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  useEffect(() => {
    if (!open) return
    field.current?.focus()
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [open])

  const send = async (text) => {
    const content = text.trim()
    if (!content || busy) return
    const history = messages.filter((m) => !m.error).slice(-10).map(({ role, content }) => ({ role, content }))
    setMessages((m) => [...m, { role: 'user', content }])
    setInput('')
    setBusy(true)
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chatInput: content, history }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.output) throw new Error()
      setMessages((m) => [...m, { role: 'assistant', content: data.output }])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: t.chat.error, error: true }])
    } finally {
      setBusy(false)
    }
  }

  if (!configured) return null

  return (
    <div className="fixed bottom-5 end-5 z-[65]" style={{ translate: `${offset.x}px ${offset.y}px` }}>
      {open && (
        <div role="dialog" aria-label={t.chat.title} className={`absolute ${corner.up ? 'bottom-full mb-3' : 'top-full mt-3'} ${corner.end ? 'end-0' : 'start-0'} flex h-[min(560px,72svh)] w-[min(380px,calc(100vw-2.5rem))] flex-col border border-line-strong bg-coal shadow-2xl shadow-black/60`} style={{ maxHeight: corner.room }}>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="t-label flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent animate-pulse-dot" />{t.chat.title}</p>
            <button type="button" onClick={() => setOpen(false)} aria-label={t.a11y.close} className="text-mute hover:text-bone"><X className="size-4" /></button>
          </div>
          <div ref={list} className="flex-1 space-y-4 overflow-y-auto px-4 py-4 text-sm leading-relaxed" data-lenis-prevent aria-live="polite">
            <p className="text-mute">{t.chat.intro}</p>
            {messages.length === 0 && (
              <div className="flex flex-col items-start gap-2">
                {t.chat.suggestions.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)} className="t-mono border border-line px-2.5 py-1.5 text-start text-bone/80 transition-colors hover:border-accent hover:text-accent">{s}</button>
                ))}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'ms-8 bg-ash px-3 py-2 text-bone' : `me-4 ${m.error ? 'text-danger' : 'text-bone/85'}`}>
                {m.role === 'assistant' ? <Markdown text={m.content} /> : m.content}
              </div>
            ))}
            {busy && <p className="t-mono text-mute">…</p>}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(input) }} className="flex border-t border-line">
            <input
              ref={field}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 1000))}
              placeholder={t.chat.placeholder}
              aria-label={t.chat.placeholder}
              className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm placeholder:text-faint focus:outline-none"
            />
            <button type="submit" disabled={busy || !input.trim()} aria-label={t.chat.send} className="px-4 text-accent disabled:text-faint"><ArrowUp className="size-4" /></button>
          </form>
        </div>
      )}
      <button
        ref={launcher}
        type="button"
        onClick={() => { if (!wasDragged()) setOpen((v) => !v) }}
        {...handlers}
        aria-expanded={open}
        title={t.chat.drag}
        data-cursor="Drag"
        className="t-label flex touch-none select-none items-center gap-2 border border-line-strong bg-ink/90 py-3 pe-4 ps-2 transition-colors hover:border-accent hover:text-accent active:cursor-grabbing"
      >
        <GripVertical aria-hidden="true" className="size-3.5 text-faint" />
        <span className="size-1.5 rounded-full bg-accent" />
        {open ? t.a11y.close : t.chat.open}
      </button>
    </div>
  )
}
