'use client'

import { useRef } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { gsap, useGSAP, prefersReducedMotion } from '@/components/motion/gsap'
import { onIntro } from '@/components/motion/intro'
import { SplitText } from '@/components/motion/split-text'
import { Magnetic } from '@/components/motion/magnetic'
import { useSmoothScroll } from '@/components/motion/smooth-scroll'
import { useLocale } from './locale-provider'
import { LocalTime } from './local-time'

export function Hero({ profile }) {
  const { t, locale } = useLocale()
  const { scrollTo } = useSmoothScroll()
  const root = useRef(null)
  const [first, ...rest] = profile.name.split(' ')
  const last = rest.join(' ')

  useGSAP(() => {
    const q = gsap.utils.selector(root)
    if (prefersReducedMotion()) return
    gsap.set(q('.hero-name .split-item'), { yPercent: 115 })
    gsap.set(q('.hero-fade'), { opacity: 0, y: 24 })
    gsap.set(q('.hero-rule'), { scaleX: 0 })
    const play = () => {
      gsap.timeline({ defaults: { ease: 'expo.out' } })
        .to(q('.hero-name .split-item'), { yPercent: 0, duration: 1.6, stagger: 0.045 })
        .to(q('.hero-rule'), { scaleX: 1, duration: 1.4 }, 0.35)
        .to(q('.hero-fade'), { opacity: 1, y: 0, duration: 1.2, stagger: 0.08 }, 0.55)
    }
    const off = onIntro(play)

    // Name drifts apart and fades as you leave the hero.
    gsap.to(q('.hero-name-first'), { xPercent: locale === 'ar' ? 8 : -8, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true } })
    gsap.to(q('.hero-name-last'), { xPercent: locale === 'ar' ? -10 : 10, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true } })
    gsap.to(q('.hero-inner'), { opacity: 0, ease: 'none', scrollTrigger: { trigger: root.current, start: '30% top', end: 'bottom top', scrub: true } })
    return off
  }, { scope: root, dependencies: [locale] })

  return (
    <section id="top" ref={root} data-station="hero" className="relative z-10 flex min-h-[100svh] flex-col">
      {/* Phones: keep text legible over the centred 3D core */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/10 via-ink/55 to-ink/80 md:hidden" />
      <div className="hero-inner wrap relative flex flex-1 flex-col pb-10 pt-28 md:pt-32">
        <div className="hero-fade t-label flex flex-wrap items-center gap-x-8 gap-y-2 text-mute">
          <span className="flex items-center gap-2">
            <span className={`size-1.5 rounded-full ${profile.available ? 'bg-accent animate-pulse-dot' : 'bg-faint'}`} />
            {profile.available ? t.hero.available : t.hero.unavailable}
          </span>
          <span>{profile.location}</span>
          <span><LocalTime timezone={profile.timezone} locale={locale} /></span>
        </div>

        <h1 className="hero-name t-hero mt-auto pt-16">
          <SplitText text={first} by="char" className="hero-name-first block" />
          <SplitText text={last} by="char" className="hero-name-last block ps-[0.55em] text-transparent [-webkit-text-stroke:1.5px_var(--bone)]" />
        </h1>

        <div className="hero-rule mt-8 h-px origin-left bg-line-strong rtl:origin-right" />

        <div className="mt-8 grid gap-8 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="hero-fade t-label text-accent">{profile.title}</p>
            <p className="hero-fade t-mono mt-3 text-mute" dir="ltr">{profile.stack}</p>
          </div>
          <div className="md:col-span-6 md:col-start-7 lg:col-span-5 lg:col-start-7">
            <p className="hero-fade max-w-[40ch] text-lg leading-relaxed text-bone/85 md:text-xl">{profile.introduction}</p>
            <div className="hero-fade mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Magnetic>
                <a
                  href="#work"
                  onClick={(e) => { e.preventDefault(); scrollTo('#work') }}
                  className="group inline-flex items-center gap-3 bg-bone px-6 py-4 text-sm font-medium text-ink transition-colors hover:bg-accent"
                >
                  {t.hero.explore}
                  <ArrowDownRight className="size-4 transition-transform duration-500 group-hover:rotate-[-45deg] rtl:-scale-x-100" />
                </a>
              </Magnetic>
              <a
                href="#contact"
                onClick={(e) => { e.preventDefault(); scrollTo('#contact') }}
                className="link-line inline-flex items-center gap-2 py-1 text-sm"
              >
                {t.hero.talk}
                <ArrowUpRight className="size-4 rtl:-scale-x-100" />
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="hero-fade pointer-events-none absolute bottom-8 end-[var(--gutter)] hidden flex-col items-center gap-3 md:flex">
        <span className="t-label text-mute [writing-mode:vertical-rl]">{t.hero.scroll}</span>
        <span className="h-14 w-px overflow-hidden bg-line"><span className="block h-full w-full bg-accent animate-scroll-line" /></span>
      </div>
    </section>
  )
}
