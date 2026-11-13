'use client'

import { useGSAP, ScrollTrigger, gsap, prefersReducedMotion } from '@/components/motion/gsap'
import { sceneState } from './scene-state'

let introPlayed = false

// Maps page scroll to camera stations: while section i scrolls into view the
// camera travels from station i-1 to station i.
export function SceneDirector({ rtl = false }) {
  useGSAP(() => {
    sceneState.rtl = rtl
    const sections = gsap.utils.toArray('[data-station]')
    const triggers = sections.slice(1).map((el, idx) => ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      end: 'top 15%',
      onUpdate: (self) => { sceneState.station = idx + self.progress },
      onLeave: () => { sceneState.station = idx + 1 },
      onLeaveBack: () => { sceneState.station = idx },
    }))

    // Entrance: the code core rises once the loader has cleared.
    const intro = () => {
      if (introPlayed || prefersReducedMotion()) {
        sceneState.intro = 1
        return
      }
      introPlayed = true
      gsap.to(sceneState, { intro: 1, duration: 3.2, ease: 'expo.out' })
    }
    if (document.documentElement.dataset.introDone) intro()
    else window.addEventListener('p3d:intro', intro, { once: true })
    ScrollTrigger.refresh()

    return () => {
      triggers.forEach((t) => t.kill())
      window.removeEventListener('p3d:intro', intro)
    }
  }, { dependencies: [rtl], revertOnUpdate: true })
  return null
}
