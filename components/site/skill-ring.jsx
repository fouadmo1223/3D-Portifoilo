'use client'

import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '@/components/motion/gsap'

const isMonoIcon = (src) => src.includes('simple-icons') || src.includes('nextjs') || src.includes('express') || src.includes('/skills/')

// A CSS-3D cylinder of every skill. Drag to spin (with inertia); scrolling nudges it.
// Items facing away dim out; the highlighted discipline glows green.
export function SkillRing({ skills, highlight }) {
  const stage = useRef(null)
  const ring = useRef(null)
  const items = useRef([])
  const state = useRef({ angle: 0, velocity: 0.12, dragging: false, lastX: 0, lastT: 0 })

  useEffect(() => {
    const reduce = prefersReducedMotion()
    const n = skills.length
    const step = 360 / n
    let raf = 0
    let visible = true
    const radius = () => Math.min(stage.current?.clientWidth ?? 400, 560) * 0.42

    const render = () => {
      const s = state.current
      if (!s.dragging) {
        s.angle += s.velocity
        s.velocity += ((reduce ? 0 : 0.08) - s.velocity) * 0.02
      }
      const r = radius()
      for (let i = 0; i < n; i++) {
        const el = items.current[i]
        if (!el) continue
        const a = i * step + s.angle
        const facing = Math.cos((a * Math.PI) / 180) // 1 = front, -1 = back
        el.style.transform = `rotateY(${a}deg) translateZ(${r}px)`
        el.style.opacity = String(0.08 + Math.max(0, facing) * 0.92)
        el.style.zIndex = String(Math.round((facing + 1) * 50))
      }
      if (visible) raf = requestAnimationFrame(render)
    }

    // Only animate while on screen.
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      cancelAnimationFrame(raf)
      if (visible) raf = requestAnimationFrame(render)
    })
    io.observe(stage.current)

    const onScroll = () => { if (!reduce) state.current.velocity += 0.015 }
    window.addEventListener('wheel', onScroll, { passive: true })
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
      window.removeEventListener('wheel', onScroll)
    }
  }, [skills.length])

  const down = (e) => {
    const s = state.current
    s.dragging = true
    s.lastX = e.clientX
    s.lastT = performance.now()
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const move = (e) => {
    const s = state.current
    if (!s.dragging) return
    const dx = e.clientX - s.lastX
    const now = performance.now()
    s.angle += dx * 0.35
    s.velocity = (dx * 0.35) / Math.max(1, (now - s.lastT) / 16)
    s.lastX = e.clientX
    s.lastT = now
  }
  const up = () => { state.current.dragging = false }

  return (
    <div
      ref={stage}
      className="relative mx-auto aspect-square w-full max-w-[560px] touch-pan-y select-none [perspective:1100px]"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      data-cursor="Drag"
      role="img"
      aria-label={skills.map((s) => s.name).join(', ')}
    >
      <div aria-hidden="true" className="absolute inset-[18%] rounded-full border border-line" />
      <div aria-hidden="true" className="absolute inset-[34%] rounded-full border border-dashed border-line" />
      <div ref={ring} aria-hidden="true" className="absolute left-1/2 top-1/2 [transform-style:preserve-3d] [transform:rotateX(-14deg)]">
        {skills.map((s, i) => {
          const on = highlight && s.category === highlight
          return (
            <div
              key={s.id}
              ref={(el) => { items.current[i] = el }}
              className="absolute -translate-x-1/2 -translate-y-1/2 [backface-visibility:hidden]"
              style={{ top: `${((i % 7) - 3) * 30}px` }}
            >
              <span className={`t-mono flex items-center gap-2 whitespace-nowrap border px-2.5 py-1.5 transition-colors duration-500 ${on ? 'border-accent bg-accent text-ink' : highlight ? 'border-line bg-ink/80 text-faint' : 'border-line-strong bg-ink/80 text-bone'}`}>
                {s.icon && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.icon} alt="" width={14} height={14} loading="lazy" className={`size-3.5 ${isMonoIcon(s.icon) && !on ? 'invert' : ''}`} />
                )}
                {s.name}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
