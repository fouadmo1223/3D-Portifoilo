'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap, prefersReducedMotion } from '@/components/motion/gsap'
import { markIntroDone } from '@/components/motion/intro'
import { useLocale } from './locale-provider'

// A short count-up on the first visit of a session; a quick fade afterwards.
// It waits for fonts (not the 3D scene) so content is never held hostage.
export function Loader() {
  const { t, locale } = useLocale()
  const root = useRef(null)
  const count = useRef(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (document.documentElement.dataset.introDone) {
      setDone(true)
      return
    }
    let seen = false
    try { seen = sessionStorage.getItem('p3d_seen') === '1' } catch {}
    const finish = () => {
      try { sessionStorage.setItem('p3d_seen', '1') } catch {}
      document.documentElement.style.removeProperty('overflow')
      markIntroDone()
      setDone(true)
    }
    if (prefersReducedMotion()) {
      finish()
      return
    }
    document.documentElement.style.overflow = 'hidden'
    const counter = { v: 0 }
    const fonts = document.fonts?.ready ?? Promise.resolve()
    const minTime = new Promise((r) => setTimeout(r, seen ? 250 : 1400))
    const cap = new Promise((r) => setTimeout(r, 3000))

    const tl = gsap.timeline({ paused: true, onComplete: finish })
    if (!seen) {
      tl.to(counter, {
        v: 100, duration: 1.2, ease: 'power2.inOut',
        onUpdate: () => { if (count.current) count.current.textContent = String(Math.round(counter.v)).padStart(3, '0') },
      })
      tl.to('.loader-line', { yPercent: -110, duration: 0.8, ease: 'expo.in', stagger: 0.05 }, '+=0.1')
    }
    tl.to(root.current, { clipPath: 'inset(0 0 100% 0)', duration: seen ? 0.6 : 1.05, ease: 'expo.inOut' }, seen ? 0 : '-=0.35')

    let cancelled = false
    Promise.race([Promise.all([fonts, minTime]), cap]).then(() => { if (!cancelled) tl.play() })
    return () => {
      cancelled = true
      tl.kill()
      document.documentElement.style.removeProperty('overflow')
    }
  }, [])

  if (done) return null
  return (
    <div ref={root} className="fixed inset-0 z-[95] flex flex-col justify-between bg-ink p-[var(--gutter)]" style={{ clipPath: 'inset(0 0 0 0)' }} role="status" aria-label={t.loader}>
      <div className="flex justify-between">
        <span className="mask"><span className="loader-line t-label text-mute">{t.loader}</span></span>
        <span className="mask"><span className="loader-line t-label text-mute">{locale === 'ar' ? '٢٠٢٦' : '2026'}</span></span>
      </div>
      <div className="flex items-end justify-between gap-6">
        <span className="mask"><span className="loader-line t-display block">{locale === 'ar' ? 'فؤاد محمد' : 'Fouad Mohamed'}</span></span>
        <span className="mask"><span ref={count} className="loader-line t-display block tabular-nums text-accent">000</span></span>
      </div>
    </div>
  )
}
