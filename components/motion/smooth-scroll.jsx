'use client'

import { createContext, useContext, useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger, prefersReducedMotion } from './gsap'

const ScrollContext = createContext({ lenis: null, scrollTo: () => {} })

// Lenis drives the page; GSAP's ticker drives Lenis so ScrollTrigger stays in sync.
export function SmoothScroll({ children }) {
  const [lenis, setLenis] = useState(null)
  const lenisRef = useRef(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const instance = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true })
    lenisRef.current = instance
    setLenis(instance)
    instance.on('scroll', ScrollTrigger.update)
    const tick = (time) => instance.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(tick)
      instance.destroy()
      lenisRef.current = null
      setLenis(null)
    }
  }, [])

  const scrollTo = (target, opts = {}) => {
    const el = typeof target === 'string' ? document.querySelector(target) : target
    if (lenisRef.current) lenisRef.current.scrollTo(el ?? target, { offset: 0, duration: 1.6, ...opts })
    else if (el?.scrollIntoView) el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
    else if (typeof target === 'number') window.scrollTo({ top: target })
  }

  return <ScrollContext.Provider value={{ lenis, scrollTo }}>{children}</ScrollContext.Provider>
}

export const useSmoothScroll = () => useContext(ScrollContext)
