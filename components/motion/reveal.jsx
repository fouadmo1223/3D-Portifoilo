'use client'

import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from './gsap'

// Slides masked words/lines up when the block scrolls into view.
export function Reveal({ as: Tag = 'div', children, className = '', selector = '.split-item', stagger = 0.04, delay = 0, start = 'top 85%' }) {
  const ref = useRef(null)
  useGSAP(() => {
    const items = ref.current.querySelectorAll(selector)
    const targets = items.length ? items : [ref.current]
    if (prefersReducedMotion()) return
    gsap.from(targets, {
      yPercent: items.length ? 110 : 0,
      y: items.length ? 0 : 40,
      opacity: items.length ? 1 : 0,
      duration: 1.2,
      stagger,
      delay,
      scrollTrigger: { trigger: ref.current, start, once: true },
    })
  }, { scope: ref })
  return <Tag ref={ref} className={className}>{children}</Tag>
}
