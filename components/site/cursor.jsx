'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap, prefersReducedMotion } from '@/components/motion/gsap'

// Desktop-only cursor: a dot plus a lagging ring that grows over interactive
// elements and shows a label for elements with data-cursor="Label".
export function Cursor() {
  const dot = useRef(null)
  const ring = useRef(null)
  const [label, setLabel] = useState('')
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine) and (hover: hover)')
    if (!fine.matches || prefersReducedMotion()) return
    setEnabled(true)
  }, [])

  useEffect(() => {
    if (!enabled) return
    document.documentElement.classList.add('has-cursor')
    const dx = gsap.quickTo(dot.current, 'x', { duration: 0.12, ease: 'power3' })
    const dy = gsap.quickTo(dot.current, 'y', { duration: 0.12, ease: 'power3' })
    const rx = gsap.quickTo(ring.current, 'x', { duration: 0.55, ease: 'power3' })
    const ry = gsap.quickTo(ring.current, 'y', { duration: 0.55, ease: 'power3' })
    let state = ''

    const move = (e) => {
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY)
      const target = e.target.closest?.('[data-cursor], a, button, [role="button"], input, textarea, select, label')
      const text = target?.getAttribute?.('data-cursor') ?? ''
      const next = !target ? '' : target.matches('input, textarea, select') ? 'text' : text ? 'label' : 'link'
      if (next !== state || text !== label) {
        state = next
        setLabel(next === 'label' ? text : '')
        gsap.to(ring.current, {
          scale: next === 'label' ? 3.2 : next === 'link' ? 1.8 : next === 'text' ? 0.4 : 1,
          backgroundColor: next === 'label' ? 'rgba(232,228,218,1)' : 'rgba(232,228,218,0)',
          duration: 0.45,
          ease: 'expo.out',
        })
        gsap.to(dot.current, { scale: next ? 0 : 1, duration: 0.3 })
      }
    }
    const hide = () => gsap.to([dot.current, ring.current], { opacity: 0, duration: 0.3 })
    const show = () => gsap.to([dot.current, ring.current], { opacity: 1, duration: 0.3 })
    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerleave', hide)
    document.addEventListener('pointerenter', show)
    return () => {
      document.documentElement.classList.remove('has-cursor')
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', hide)
      document.removeEventListener('pointerenter', show)
    }
  }, [enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!enabled) return null
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[100]">
      <div ref={dot} className="absolute -left-[3px] -top-[3px] size-1.5 rounded-full bg-bone" />
      <div ref={ring} className="absolute -left-4 -top-4 flex size-8 items-center justify-center rounded-full border border-bone/70">
        <span className="t-label scale-[0.32] whitespace-nowrap text-ink">{label}</span>
      </div>
    </div>
  )
}
