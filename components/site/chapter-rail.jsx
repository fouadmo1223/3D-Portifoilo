'use client'

import { useEffect, useState } from 'react'
import { Braces, Briefcase, Layers, Mail, MonitorPlay, UserRound } from 'lucide-react'
import { sceneState } from '@/components/three/scene-state'
import { useSmoothScroll } from '@/components/motion/smooth-scroll'
import { useLocale } from './locale-provider'

const CHAPTERS = [
  { id: 'top', icon: Braces },
  { id: 'about', icon: UserRound },
  { id: 'expertise', icon: Layers },
  { id: 'work', icon: MonitorPlay },
  { id: 'experience', icon: Briefcase },
  { id: 'contact', icon: Mail },
]

// A small rail on the edge of the screen: one mark per landmark in the 3D world.
// It follows the camera (sceneState.station) and jumps to a chapter on click.
export function ChapterRail() {
  const { t, locale } = useLocale()
  const { scrollTo } = useSmoothScroll()
  const [active, setActive] = useState(0)

  useEffect(() => {
    let raf
    let last = 0
    const tick = () => {
      const next = Math.max(0, Math.min(CHAPTERS.length - 1, Math.round(sceneState.station)))
      if (next !== last) { last = next; setActive(next) }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const label = (id) => (id === 'top' ? (locale === 'ar' ? 'البداية' : 'Start') : t.nav[id])

  return (
    <nav aria-label={locale === 'ar' ? 'الفصول' : 'Chapters'} className="fixed end-4 top-1/2 z-40 hidden -translate-y-1/2 lg:block">
      <ol className="flex flex-col items-end gap-1">
        {CHAPTERS.map(({ id, icon: Icon }, i) => {
          const on = i === active
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => scrollTo(id === 'top' ? 0 : `#${id}`)}
                aria-current={on ? 'step' : undefined}
                className="group flex items-center gap-3 py-1.5 ps-3"
              >
                <span className={`t-label transition-all duration-300 ${on ? 'translate-x-0 text-accent opacity-100' : 'translate-x-2 text-mute opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 rtl:-translate-x-2'}`}>{label(id)}</span>
                <span className={`grid size-7 place-items-center border transition-all duration-300 ${on ? 'border-accent bg-accent/10 text-accent shadow-[0_0_18px_-4px_var(--accent)]' : 'border-transparent text-faint group-hover:text-bone'}`}>
                  <Icon className="size-3.5" aria-hidden="true" />
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
