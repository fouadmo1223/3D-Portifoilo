'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap, prefersReducedMotion } from '@/components/motion/gsap'
import { markIntroDone } from '@/components/motion/intro'
import { useLocale } from './locale-provider'

const FRAMES = 11
const GAP = 250 // depth between tunnel frames, px
const HALF = 60 // half the cube's edge, px
const FACES = [
  `translateZ(${HALF}px)`, `rotateY(180deg) translateZ(${HALF}px)`,
  `rotateY(90deg) translateZ(${HALF}px)`, `rotateY(-90deg) translateZ(${HALF}px)`,
  `rotateX(90deg) translateZ(${HALF}px)`, `rotateX(-90deg) translateZ(${HALF}px)`,
]

// Entrance: a spinning wireframe cube at the mouth of a tunnel of light frames.
// When the page is ready the camera flies through the cube and down the tunnel into the site.
// Built with CSS 3D (no second WebGL context) and it waits for fonts only, never the scene.
// Returning visitors in the same session get a half-second version.
export function Loader() {
  const { t, locale } = useLocale()
  const root = useRef(null)
  const world = useRef(null)
  const tunnel = useRef(null)
  const cube = useRef(null)
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

    const ctx = gsap.context(() => {
      const frames = gsap.utils.toArray('.loader-frame')
      frames.forEach((el, i) => gsap.set(el, { xPercent: -50, yPercent: -50, z: -i * GAP, rotation: i * 9, opacity: Math.max(0.08, 1 - i * 0.1) }))
      gsap.set(cube.current, { rotationX: -24, rotationY: 32 })

      // Idle motion while the page gets ready.
      gsap.from(frames, { scale: 0.55, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.05 })
      gsap.from(cube.current, { scale: 0, duration: 0.9, ease: 'back.out(1.6)' })
      gsap.to(cube.current, { rotationY: '+=360', rotationX: '+=360', duration: 7, ease: 'none', repeat: -1 })
      gsap.to(tunnel.current, { rotation: 360, duration: 40, ease: 'none', repeat: -1 })
      gsap.from('.loader-line', { yPercent: 110, duration: 0.9, ease: 'expo.out', stagger: 0.06, delay: 0.1 })
    }, root)

    const counter = { v: 0 }
    const tl = gsap.timeline({ paused: true, onComplete: finish })
    if (!seen) {
      tl.to(counter, {
        v: 100, duration: 1.25, ease: 'power2.inOut',
        onUpdate: () => {
          if (count.current) count.current.textContent = String(Math.round(counter.v)).padStart(3, '0')
          root.current?.style.setProperty('--load', String(counter.v / 100))
        },
      })
      tl.to('.loader-line', { yPercent: -110, duration: 0.6, ease: 'expo.in', stagger: 0.04 }, '+=0.05')
    }
    // The fly-through: the whole world rushes past the camera.
    const fly = seen ? 0.7 : 1.25
    tl.to(world.current, { z: FRAMES * GAP + 700, duration: fly, ease: 'expo.in' }, seen ? 0 : '-=0.3')
    tl.to(cube.current, { scale: 2.2, duration: fly, ease: 'expo.in' }, '<')
    tl.to(root.current, { autoAlpha: 0, duration: 0.4, ease: 'power2.in' }, `-=${0.42}`)

    const fonts = document.fonts?.ready ?? Promise.resolve()
    const minTime = new Promise((r) => setTimeout(r, seen ? 150 : 1300))
    const cap = new Promise((r) => setTimeout(r, 3000))
    let cancelled = false
    Promise.race([Promise.all([fonts, minTime]), cap]).then(() => { if (!cancelled) tl.play() })
    return () => {
      cancelled = true
      tl.kill()
      ctx.revert()
      document.documentElement.style.removeProperty('overflow')
    }
  }, [])

  if (done) return null
  return (
    <div ref={root} className="loader fixed inset-0 z-[95] overflow-hidden bg-ink" role="status" aria-label={t.loader}>
      <div className="loader-stage" aria-hidden="true">
        <div ref={world} className="loader-3d">
          <div ref={tunnel} className="loader-3d">
            {Array.from({ length: FRAMES }, (_, i) => <span key={i} className="loader-frame" />)}
          </div>
          <div ref={cube} className="loader-cube">
            {FACES.map((transform, i) => <span key={i} className="loader-face" style={{ transform }}>{i < 2 ? '</>' : ''}</span>)}
            <span className="loader-core" />
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-[var(--gutter)]">
        <div className="flex justify-between">
          <span className="mask"><span className="loader-line t-label block text-mute">{t.loader}</span></span>
          <span className="mask"><span className="loader-line t-label block text-mute">{locale === 'ar' ? '٢٠٢٦' : '2026'}</span></span>
        </div>
        <div>
          <div className="flex items-end justify-between gap-6">
            <span className="mask"><span className="loader-line t-display block">{locale === 'ar' ? 'فؤاد محمد' : 'Fouad Mohamed'}</span></span>
            <span className="mask"><span className="loader-line block font-mono text-sm tabular-nums text-accent"><span ref={count}>000</span>%</span></span>
          </div>
          <div className="loader-bar mt-4" />
        </div>
      </div>
    </div>
  )
}
