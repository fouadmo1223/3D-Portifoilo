'use client'

import { useRef } from 'react'
import { gsap, useGSAP } from '@/components/motion/gsap'

export function ScrollProgress() {
  const bar = useRef(null)
  useGSAP(() => {
    gsap.to(bar.current, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: { trigger: document.documentElement, start: 'top top', end: 'bottom bottom', scrub: 0.3 },
    })
  })
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-px">
      <div ref={bar} className="h-full origin-left scale-x-0 bg-accent rtl:origin-right" />
    </div>
  )
}
