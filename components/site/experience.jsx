'use client'

import { useEffect, useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '@/components/motion/gsap'
import { SplitText } from '@/components/motion/split-text'
import { Reveal } from '@/components/motion/reveal'
import { formatMonth } from '@/lib/localize'
import { useLocale } from './locale-provider'
import { SectionLabel } from './section-label'
import { focusExperience, setFocus } from '@/components/three/focus'

export function Experience({ items }) {
  const { t, locale } = useLocale()
  const root = useRef(null)

  useGSAP(() => {
    const q = gsap.utils.selector(root)
    if (prefersReducedMotion() || !items.length) return
    // The spine draws itself as you read; each node lights when its role reaches mid-screen.
    gsap.fromTo(q('.xp-spine'), { scaleY: 0 }, {
      scaleY: 1, ease: 'none',
      scrollTrigger: { trigger: q('.xp-list')[0], start: 'top 65%', end: 'bottom 60%', scrub: true },
    })
    q('.xp-item').forEach((item) => {
      gsap.from(item.querySelectorAll('.xp-in'), {
        y: 36, opacity: 0, stagger: 0.07, duration: 1.1,
        scrollTrigger: { trigger: item, start: 'top 82%', once: true },
      })
      gsap.to(item.querySelector('.xp-node'), {
        backgroundColor: '#4af2a1', borderColor: '#4af2a1', scale: 1.4, duration: 0.4,
        scrollTrigger: { trigger: item, start: 'top 55%', toggleActions: 'play none none reverse' },
      })
    })
  }, { scope: root, dependencies: [items.length] })

  useEffect(() => () => setFocus(null), [])
  const present = t.experience.present
  const show = (e) => setFocus(focusExperience(e, { from: formatMonth(e.start, locale), to: e.current ? present : formatMonth(e.end, locale) }))

  if (!items.length) return null
  const years = items.flatMap((e) => [new Date(e.start).getUTCFullYear(), e.current ? new Date().getUTCFullYear() : e.end && new Date(e.end).getUTCFullYear()]).filter(Boolean)

  return (
    <section id="experience" ref={root} data-station="experience" className="relative z-10 py-[16vh]">
      <div className="wrap grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <SectionLabel index={4}>{t.experience.label}</SectionLabel>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
            <Reveal as="h2" className="t-display max-w-[12ch]"><SplitText text={t.experience.title} /></Reveal>
            <p className="t-mono text-mute tabular-nums">{Math.min(...years)} — {Math.max(...years)}</p>
          </div>

          <ol className="xp-list hover-focus relative mt-16" onPointerLeave={() => setFocus(null)}>
            <span aria-hidden="true" className="absolute inset-y-0 start-[5px] w-px bg-line" />
            <span aria-hidden="true" className="xp-spine absolute inset-y-0 start-[5px] w-px origin-top bg-accent/70" />
            {items.map((e) => (
              <li key={e.id} onPointerEnter={() => show(e)} className="xp-item hover-focus-item group relative grid gap-4 pb-16 ps-10 last:pb-0 md:grid-cols-[11rem_1fr] md:gap-10">
                <span aria-hidden="true" className="xp-node absolute start-0 top-2 size-[11px] rounded-full border border-line-strong bg-ink" />
                <p className="xp-in t-mono pt-1 text-mute">
                  {formatMonth(e.start, locale)} — {e.current ? <span className="text-accent">{t.experience.present}</span> : formatMonth(e.end, locale)}
                </p>
                <div>
                  <h3 className="xp-in t-title transition-[color,translate] duration-500 ease-[var(--ease-out)] group-hover:translate-x-2 group-hover:text-accent rtl:group-hover:-translate-x-2">{e.position}</h3>
                  <p className="xp-in mt-2 text-bone/80">{e.company}{e.location ? <span className="text-mute"> · {e.location}</span> : null}</p>
                  {e.description && <p className="xp-in mt-5 max-w-[60ch] text-mute">{e.description}</p>}
                  {e.achievements.length > 0 && (
                    <ul className="xp-in mt-5 space-y-2">
                      {e.achievements.map((a) => <li key={a} className="flex gap-3 text-bone/80"><span className="text-accent">—</span>{a}</li>)}
                    </ul>
                  )}
                  {e.technologies.length > 0 && (
                    <p className="xp-in t-mono mt-6 text-faint" dir="ltr">{e.technologies.join(' / ')}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
