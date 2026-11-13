'use client'

import { useRef, useState } from 'react'
import { Img as Image } from '@/components/site/img'
import { ArrowUpRight } from 'lucide-react'
import { gsap, useGSAP, ScrollTrigger, prefersReducedMotion } from '@/components/motion/gsap'
import { sceneState } from '@/components/three/scene-state'
import { useLocale } from './locale-provider'
import { SectionLabel } from './section-label'
import { TransitionLink } from './page-transition'

// Brief displacement ripple on hover (SVG filter applied only while animating).
function useDistort(id) {
  const tween = useRef(null)
  const enter = (e) => {
    if (prefersReducedMotion()) return
    const img = e.currentTarget.querySelector('.reel-img')
    const map = document.querySelector(`#${id} feDisplacementMap`)
    if (!img || !map) return
    tween.current?.kill()
    img.style.filter = `url(#${id})`
    const v = { s: 0 }
    tween.current = gsap.timeline({ onComplete: () => { img.style.filter = '' } })
      .to(v, { s: 34, duration: 0.35, ease: 'power2.out', onUpdate: () => map.setAttribute('scale', v.s) })
      .to(v, { s: 0, duration: 0.9, ease: 'expo.out', onUpdate: () => map.setAttribute('scale', v.s) })
  }
  return enter
}

function Frame({ project, index, total, t }) {
  const filterId = `distort-${index}`
  const distort = useDistort(filterId)
  return (
    <article className="reel-frame group relative w-[84vw] shrink-0 snap-center md:w-[min(82vh,58vw)]" data-index={index}>
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <filter id={filterId}>
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.04" numOctaves="1" seed={index + 2} />
          <feDisplacementMap in="SourceGraphic" scale="0" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <TransitionLink href={`/work/${project.slug}`} className="block" data-cursor={t.work.view} onPointerEnter={distort}>
        <div className="reel-media relative aspect-[16/10] overflow-hidden bg-coal">
          <Image
            src={project.thumbnail}
            alt={project.title}
            fill
            sizes="(max-width: 768px) 84vw, 58vw"
            className="reel-img object-cover object-top transition-transform duration-[1.4s] ease-[var(--ease-out)] group-hover:scale-[1.04]"
            priority={index < 2}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
        </div>
      </TransitionLink>
      <div className="mt-5 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2">
        <span className="t-mono pt-2 text-accent">{String(index + 1).padStart(2, '0')}<span className="text-faint">/{String(total).padStart(2, '0')}</span></span>
        <div>
          <h3 className="t-title">
            <TransitionLink href={`/work/${project.slug}`} className="link-line">{project.title}</TransitionLink>
          </h3>
          <p className="mt-2 line-clamp-2 max-w-[52ch] text-sm text-mute">{project.short}</p>
          <div className="t-mono mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-mute">
            <span className="text-bone/80">{project.category}{project.year ? ` · ${project.year}` : ''}</span>
            <span dir="ltr" className="truncate">{project.technologies.slice(0, 4).join(' / ')}</span>
            {project.liveUrl && (
              <a href={project.liveUrl} target="_blank" rel="noreferrer" className="link-line inline-flex items-center gap-1 text-bone">
                {t.work.live}<ArrowUpRight className="size-3 rtl:-scale-x-100" />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

export function WorkReel({ projects }) {
  const { t, locale } = useLocale()
  const section = useRef(null)
  const track = useRef(null)
  const [active, setActive] = useState(0)

  useGSAP(() => {
    sceneState.workPresence = 0
    const setPresence = (v) => gsap.to(sceneState, { workPresence: v, duration: 0.8, overwrite: true })
    const pickActive = () => {
      const frames = track.current.querySelectorAll('.reel-frame')
      const mid = window.innerWidth / 2
      let best = 0
      let bestDist = Infinity
      frames.forEach((f, i) => {
        const r = f.getBoundingClientRect()
        const d = Math.abs(r.left + r.width / 2 - mid)
        if (d < bestDist) { bestDist = d; best = i }
      })
      if (sceneState.activeProject !== best) {
        sceneState.activeProject = best
        setActive(best)
      }
    }

    const mm = gsap.matchMedia()
    mm.add({ desktop: '(min-width: 768px)', reduce: '(prefers-reduced-motion: reduce)' }, (ctx) => {
      const { desktop, reduce } = ctx.conditions
      if (desktop) {
        const rtl = locale === 'ar'
        const distance = () => Math.max(0, track.current.scrollWidth - window.innerWidth)
        const scroller = gsap.to(track.current, {
          x: () => (rtl ? distance() : -distance()),
          ease: 'none',
          scrollTrigger: {
            trigger: section.current,
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: reduce ? true : 0.8,
            invalidateOnRefresh: true,
            onUpdate: pickActive,
            onToggle: (self) => setPresence(self.isActive ? 1 : 0),
          },
        })
        if (!reduce) {
          gsap.utils.toArray('.reel-media', track.current).forEach((media) => {
            gsap.fromTo(media, { clipPath: rtl ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)' }, {
              clipPath: 'inset(0 0% 0 0%)',
              ease: 'power2.out',
              scrollTrigger: { trigger: media, containerAnimation: scroller, start: rtl ? 'right 5%' : 'left 95%', end: rtl ? 'right 55%' : 'left 45%', scrub: true },
            })
            gsap.fromTo(media.querySelector('.reel-img'), { scale: 1.25 }, {
              scale: 1, ease: 'none',
              scrollTrigger: { trigger: media, containerAnimation: scroller, start: rtl ? 'right 0%' : 'left 100%', end: rtl ? 'right 40%' : 'left 20%', scrub: true },
            })
          })
        }
      } else {
        // Phones: native swipe carousel; presence follows section visibility.
        const st = ScrollTrigger.create({
          trigger: section.current, start: 'top 60%', end: 'bottom 40%',
          onToggle: (self) => setPresence(self.isActive ? 1 : 0),
        })
        const onScroll = () => pickActive()
        track.current.addEventListener('scroll', onScroll, { passive: true })
        return () => { st.kill(); track.current?.removeEventListener('scroll', onScroll) }
      }
    })
    return () => { mm.revert(); sceneState.workPresence = 0 }
  }, { scope: section, dependencies: [locale, projects.length], revertOnUpdate: true })

  if (!projects.length) return null

  return (
    <section id="work" ref={section} data-station="work" className="relative z-10 overflow-hidden md:h-[100svh]">
      <div className="flex h-full flex-col pb-12 pt-28 md:pb-[6vh] md:pt-[13vh]">
        <div className="wrap flex items-end justify-between gap-6">
          <div>
            <SectionLabel index={3}>{t.work.label}</SectionLabel>
            <h2 className="t-display mt-6 max-w-[11ch]">{t.work.title}</h2>
          </div>
          <div className="hidden text-end md:block">
            <p className="font-display text-[clamp(3rem,6vw,6rem)] leading-none tabular-nums">
              <span className="text-accent">{String(active + 1).padStart(2, '0')}</span>
              <span className="text-faint">/{String(projects.length).padStart(2, '0')}</span>
            </p>
            <p className="t-label mt-2 text-mute">{t.work.hint}</p>
          </div>
        </div>
        <div
          ref={track}
          className="mt-10 flex flex-1 snap-x snap-mandatory items-end gap-[4vw] overflow-x-auto px-[var(--gutter)] [scrollbar-width:none] md:mt-0 md:snap-none md:overflow-visible md:ps-[38vw] md:pe-[10vw] rtl:md:ps-[38vw]"
        >
          {projects.map((p, i) => <Frame key={p.id} project={p} index={i} total={projects.length} t={t} />)}
        </div>
      </div>
    </section>
  )
}
