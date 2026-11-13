'use client'

import { useEffect } from 'react'
import { useSmoothScroll } from '@/components/motion/smooth-scroll'
import { ScrollTrigger } from '@/components/motion/gsap'

// Arriving at "/#work" from another page: scroll there once pins are measured.
export function HashScroll() {
  const { scrollTo, lenis } = useSmoothScroll()
  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (!/^[a-z-]+$/.test(id)) return
    const timer = setTimeout(() => {
      ScrollTrigger.refresh()
      scrollTo(`#${id}`, { immediate: true })
    }, 350)
    return () => clearTimeout(timer)
  }, [lenis]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}
