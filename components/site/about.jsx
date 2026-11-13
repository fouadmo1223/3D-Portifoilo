'use client'

import { useRef } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { gsap, useGSAP, prefersReducedMotion } from '@/components/motion/gsap'
import { Reveal } from '@/components/motion/reveal'
import { useLocale } from './locale-provider'
import { SectionLabel } from './section-label'
import { focusPrinciple, setFocus } from '@/components/three/focus'

export function About({ profile }) {
  const { t } = useLocale()
  const root = useRef(null)
  const statement = profile.biography || profile.introduction
  const words = statement.split(/\s+/)

  // The statement "lights up" word by word as it scrolls through the viewport.
  useGSAP(() => {
    const q = gsap.utils.selector(root)
    if (prefersReducedMotion()) return
    gsap.fromTo(q('.about-word'), { opacity: 0.16 }, {
      opacity: 1,
      stagger: 0.08,
      ease: 'none',
      scrollTrigger: { trigger: q('.about-statement')[0], start: 'top 80%', end: 'bottom 45%', scrub: 0.6 },
    })
    gsap.from(q('.principle'), {
      y: 50, opacity: 0, stagger: 0.12, duration: 1.2,
      scrollTrigger: { trigger: q('.principles')[0], start: 'top 85%', once: true },
    })
  }, { scope: root, dependencies: [statement] })

  return (
    <section id="about" ref={root} data-station="about" className="relative z-10 py-[16vh]">
      <div className="wrap grid gap-y-14 md:grid-cols-12">
        <div className="md:col-span-6 md:col-start-6 lg:col-span-7 lg:col-start-6">
          <SectionLabel index={1}>{t.about.label}</SectionLabel>
          <p className="about-statement t-lead mt-10">
            {words.map((w, i) => <span key={i} className="about-word">{w}{i < words.length - 1 ? ' ' : ''}</span>)}
          </p>
        </div>

        <div className="md:col-span-7 md:col-start-6 lg:col-span-7 lg:col-start-6">
          <Reveal as="h3" className="t-label text-mute"><span className="mask"><span className="split-item">{t.about.philosophy}</span></span></Reveal>
          {profile.philosophy && <p className="mt-5 max-w-[56ch] text-bone/75">{profile.philosophy}</p>}
          <ol className="principles hover-focus mt-10 border-t border-line" onPointerLeave={() => setFocus(null)}>
            {t.about.principles.map(([title, body], i) => (
              <li key={title} onPointerEnter={() => setFocus(focusPrinciple(i, title, body))} className="principle hover-focus-kids group grid gap-2 border-b border-line py-6 sm:grid-cols-[4rem_1fr_1.4fr] sm:gap-6">
                <span className="t-mono text-accent">({String(i + 1).padStart(2, '0')})</span>
                <span className="font-display text-2xl leading-tight transition-[color,translate] duration-500 ease-[var(--ease-out)] group-hover:translate-x-2 group-hover:text-accent rtl:group-hover:-translate-x-2">{title}</span>
                <span className="text-mute">{body}</span>
              </li>
            ))}
          </ol>

          <dl className="mt-14 grid gap-10 sm:grid-cols-2">
            {profile.education.length > 0 && (
              <div>
                <dt className="t-label text-mute">{t.about.education}</dt>
                {profile.education.map((e) => (
                  <dd key={e.title} className="mt-4">
                    <p className="font-display text-xl">{e.title}</p>
                    <p className="text-sm text-mute">{e.place} · {e.period}</p>
                  </dd>
                ))}
              </div>
            )}
            <div>
              <dt className="t-label text-mute">{t.about.based}</dt>
              <dd className="mt-4 font-display text-xl">{profile.location}</dd>
              {profile.cvUrl && (
                <dd className="mt-6">
                  <a href={profile.cvUrl} target="_blank" rel="noreferrer" className="link-line t-label inline-flex items-center gap-2 text-bone">
                    CV / Résumé <ArrowUpRight className="size-3.5 rtl:-scale-x-100" />
                  </a>
                </dd>
              )}
            </div>
          </dl>
        </div>
      </div>
    </section>
  )
}
