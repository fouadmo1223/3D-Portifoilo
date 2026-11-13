'use client'

import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '@/components/motion/gsap'
import { onIntro } from '@/components/motion/intro'

// Entrance for a project page: title rises, meta fades, cover unmasks from the centre.
export function ProjectIntro({ children }) {
  const root = useRef(null)
  useGSAP(() => {
    if (prefersReducedMotion()) return
    const q = gsap.utils.selector(root)
    gsap.set(q('.intro-title .split-item'), { yPercent: 110 })
    gsap.set(q('.intro-fade'), { opacity: 0, y: 20 })
    gsap.set(q('.intro-cover'), { clipPath: 'inset(18% 18% 18% 18%)' })
    const play = () => gsap.timeline({ delay: 0.35 })
      .to(q('.intro-title .split-item'), { yPercent: 0, duration: 1.4 })
      .to(q('.intro-fade'), { opacity: 1, y: 0, duration: 1 }, 0.3)
      .to(q('.intro-cover'), { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut' }, 0.2)
    const off = onIntro(play)
    gsap.to(q('.intro-cover img'), { yPercent: 8, scale: 1.08, ease: 'none', scrollTrigger: { trigger: q('.intro-cover')[0], start: 'top 60%', end: 'bottom top', scrub: true } })
    return off
  }, { scope: root })
  return <div ref={root}>{children}</div>
}
