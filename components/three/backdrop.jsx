'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { sceneState } from './scene-state'
import { prefersReducedMotion } from '@/components/motion/gsap'

const Scene = dynamic(() => import('./scene'), { ssr: false })

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

// Fixed 3D stage behind the page. The scene loads after first paint so it
// never blocks text or images; without WebGL a static gradient stands in.
export function Backdrop({ shots = [] }) {
  const [mode, setMode] = useState('pending')
  const [ready, setReady] = useState(false)
  const dim = useRef(null)

  // The world is the star of the hero; behind the other sections it dims so text stays readable.
  useEffect(() => {
    let raf
    let shown = -1
    const tick = () => {
      const next = Math.round(Math.min(1, Math.max(0, sceneState.station / 0.7)) * 100) / 100
      if (next !== shown && dim.current) { shown = next; dim.current.style.opacity = String(next) }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    sceneState.reducedMotion = prefersReducedMotion()
    sceneState.rtl = document.documentElement.dir === 'rtl'
    if (!supportsWebGL()) {
      setMode('static')
      return
    }
    const start = () => setMode('webgl')
    const idle = window.requestIdleCallback ? window.requestIdleCallback(start, { timeout: 1200 }) : setTimeout(start, 300)
    const onPointer = (e) => {
      sceneState.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      sceneState.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onPointer, { passive: true })

    // Drag with a mouse in the hero to look around the monolith.
    let drag = null
    const onDown = (e) => {
      if (e.pointerType === 'touch' || e.button !== 0 || sceneState.station > 0.45) return
      if (e.target.closest?.('a, button, input, textarea, select, [role="dialog"], nav, header')) return
      drag = { x: e.clientX, from: sceneState.orbit, moved: false }
    }
    const onDrag = (e) => {
      if (!drag) return
      const dx = e.clientX - drag.x
      if (!drag.moved && Math.abs(dx) < 6) return
      if (!drag.moved) { drag.moved = true; document.body.classList.add('room-dragging') }
      sceneState.orbit = Math.max(-0.75, Math.min(0.75, drag.from - (dx / window.innerWidth) * 1.8))
    }
    const onUp = () => { drag = null; document.body.classList.remove('room-dragging') }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onDrag, { passive: true })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onDrag)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      document.body.classList.remove('room-dragging')
      window.cancelIdleCallback?.(idle)
      clearTimeout(idle)
      window.removeEventListener('pointermove', onPointer)
    }
  }, [])

  return (
    <div aria-hidden="true" className="fixed inset-0 z-0">
      <div className="backdrop-fallback absolute inset-0" />
      {mode === 'static' && <StaticCore />}
      {mode === 'webgl' && (
        <div className={`absolute inset-0 transition-opacity duration-[1600ms] ${ready ? 'opacity-50 md:opacity-100' : 'opacity-0'}`}>
          <Scene onReady={() => setReady(true)} shots={shots} />
        </div>
      )}
      <div ref={dim} className="pointer-events-none absolute inset-0 bg-ink/40 opacity-0" />
      {/* Vignette in CSS: free, where a post-processing pass is not. */}
      {mode === 'webgl' && (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_45%,transparent_55%,rgb(5_7_12/.75)_100%)]" />
      )}
    </div>
  )
}

function StaticCore() {
  return (
    <div className="absolute inset-y-0 end-[6%] flex items-center opacity-70">
      <span className="font-mono text-[min(28vw,18rem)] font-bold leading-none text-accent [text-shadow:0_0_60px_rgb(74_242_161/.45)]" dir="ltr">&lt;/&gt;</span>
    </div>
  )
}
