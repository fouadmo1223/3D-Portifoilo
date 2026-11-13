'use client'

import { useMemo, useRef, useState } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '@/components/motion/gsap'
import { SplitText } from '@/components/motion/split-text'
import { Reveal } from '@/components/motion/reveal'
import { useLocale } from './locale-provider'
import { SectionLabel } from './section-label'
import { SkillRing } from './skill-ring'

const ORDER = ['frontend', 'backend', 'creative', 'tools', 'soft']

export function Expertise({ skills }) {
  const { t } = useLocale()
  const root = useRef(null)
  const [highlight, setHighlight] = useState(null)
  const groups = useMemo(() => ORDER
    .map((key) => ({ key, items: skills.filter((s) => s.category === key) }))
    .filter((g) => g.items.length), [skills])
  const technical = useMemo(() => skills.filter((s) => s.category !== 'soft'), [skills])

  useGSAP(() => {
    if (prefersReducedMotion()) return
    gsap.from(gsap.utils.toArray('.discipline', root.current), {
      clipPath: 'inset(0 0 100% 0)', y: 30, stagger: 0.1, duration: 1.3,
      scrollTrigger: { trigger: root.current.querySelector('.disciplines'), start: 'top 80%', once: true },
    })
  }, { scope: root })

  return (
    <section id="expertise" ref={root} data-station="expertise" className="relative z-10 py-[16vh]">
      <div className="wrap">
        <div className="grid gap-6 md:grid-cols-12">
          <div className="md:col-span-8">
            <SectionLabel index={2}>{t.expertise.label}</SectionLabel>
            <Reveal as="h2" className="t-display mt-8 max-w-[14ch]"><SplitText text={t.expertise.title} /></Reveal>
          </div>
          <p className="t-label self-end text-mute md:col-span-4 md:text-end">{t.expertise.hint}</p>
        </div>

        <div className="mt-16 grid items-center gap-16 lg:grid-cols-12">
          <ul className="disciplines border-t border-line lg:col-span-7" onPointerLeave={() => setHighlight(null)}>
            {groups.map((g, i) => {
              const [name, blurb] = t.expertise.groups[g.key]
              const on = highlight === g.key
              return (
                <li
                  key={g.key}
                  className="discipline border-b border-line"
                  onPointerEnter={() => setHighlight(g.key)}
                  onFocus={() => setHighlight(g.key)}
                >
                  <button type="button" onClick={() => setHighlight(on ? null : g.key)} className="group grid w-full grid-cols-[2.5rem_1fr_auto] items-baseline gap-4 py-6 text-start" aria-pressed={on}>
                    <span className={`t-mono transition-colors ${on ? 'text-accent' : 'text-faint'}`}>{String(i + 1).padStart(2, '0')}</span>
                    <span>
                      <span className={`block font-display text-[clamp(2rem,4vw,3.4rem)] leading-none transition-[color,transform] duration-700 ease-[var(--ease-out)] ${on ? 'translate-x-3 text-bone rtl:-translate-x-3' : highlight ? 'text-faint' : 'text-bone'}`}>{name}</span>
                      <span className={`grid transition-[grid-template-rows] duration-700 ease-[var(--ease-out)] ${on ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                        <span className="overflow-hidden">
                          <span className="block max-w-[46ch] pt-4 text-mute">{blurb}</span>
                          <span className="t-mono block pt-3 text-bone/80" dir="ltr">{g.items.map((s) => s.name).join('  /  ')}</span>
                        </span>
                      </span>
                    </span>
                    <span className="t-mono text-mute">{String(g.items.length).padStart(2, '0')}</span>
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="lg:col-span-5">
            <SkillRing skills={technical} highlight={highlight} />
          </div>
        </div>
      </div>
    </section>
  )
}
