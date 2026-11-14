'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { gsap, prefersReducedMotion } from '@/components/motion/gsap'
import { Magnetic } from '@/components/motion/magnetic'
import { useSmoothScroll } from '@/components/motion/smooth-scroll'
import { useLocale } from './locale-provider'
import { TransitionLink, usePageTransition } from './page-transition'

const SECTIONS = ['work', 'about', 'expertise', 'experience', 'contact']
// The other, non-3D version of the portfolio.
const CLASSIC_URL = 'https://potifolio-eta-six.vercel.app/'

export function Nav() {
  const { t, locale, setLocale, pending } = useLocale()
  const pathname = usePathname()
  const isHome = pathname === '/'
  const { scrollTo } = useSmoothScroll()
  const { navigate } = usePageTransition()
  const [active, setActive] = useState('')
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)
  const overlay = useRef(null)

  // Hide on scroll down, reveal on scroll up.
  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      if (Math.abs(y - last) < 6) return
      setHidden(y > last && y > 160)
      last = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Highlight the section in view.
  useEffect(() => {
    if (!isHome) return
    const observer = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
    }, { rootMargin: '-45% 0px -50% 0px' })
    SECTIONS.forEach((id) => { const el = document.getElementById(id); if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [isHome])

  // Mobile menu animation.
  useEffect(() => {
    const el = overlay.current
    if (!el) return
    const reduce = prefersReducedMotion()
    if (open) {
      document.documentElement.style.overflow = 'hidden'
      gsap.timeline()
        .set(el, { display: 'flex' })
        .fromTo(el, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: reduce ? 0 : 0.8, ease: 'expo.inOut' })
        .from(el.querySelectorAll('.menu-item'), { yPercent: 110, stagger: 0.05, duration: reduce ? 0 : 0.9 }, '-=0.35')
    } else {
      document.documentElement.style.removeProperty('overflow')
      gsap.to(el, { clipPath: 'inset(0 0 100% 0)', duration: reduce ? 0 : 0.6, ease: 'expo.inOut', onComplete: () => gsap.set(el, { display: 'none' }) })
    }
  }, [open])

  const go = (id) => (e) => {
    e.preventDefault()
    setOpen(false)
    if (isHome) scrollTo(`#${id}`)
    else navigate(`/#${id}`)
  }

  const labels = { work: t.nav.work, about: t.nav.about, expertise: t.nav.expertise, experience: t.nav.experience, contact: t.nav.contact }

  return (
    <>
      <a href="#main" className="t-label fixed start-4 top-4 z-[80] -translate-y-20 bg-bone px-3 py-2 text-ink focus:translate-y-0">{t.a11y.skip}</a>
      <header className={`fixed inset-x-0 top-0 z-50 transition-transform duration-700 ease-[var(--ease-out)] ${hidden && !open ? '-translate-y-full' : ''}`}>
        <div className="wrap flex h-20 items-center justify-between gap-6">
          <TransitionLink href="/" className="group flex items-baseline gap-3" aria-label="Fouad Mohamed — home">
            <span className="t-mono text-base leading-none text-accent">&lt;FM /&gt;</span>
            <span className="t-label hidden text-mute transition-colors group-hover:text-bone sm:inline">{locale === 'ar' ? 'فؤاد محمد' : 'Fouad Mohamed'}</span>
          </TransitionLink>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-8">
              {SECTIONS.slice(0, 5).map((id, i) => (
                <li key={id}>
                  <a href={`/#${id}`} onClick={go(id)} className={`t-label group flex gap-2 transition-colors ${active === id ? 'text-bone' : 'text-mute hover:text-bone'}`}>
                    <span className={`transition-colors ${active === id ? 'text-accent' : 'text-faint'}`}>0{i + 1}</span>
                    <span className="link-line">{labels[id]}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-5">
            <a
              href={CLASSIC_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="t-label group hidden items-center gap-1.5 whitespace-nowrap border border-accent/50 px-3 py-2 text-accent transition-colors hover:bg-accent hover:text-ink md:inline-flex"
            >
              {t.nav.classic}
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:-scale-x-100"><path d="M3 9 9 3M4 3h5v5" /></svg>
            </a>
            <button
              type="button"
              onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
              disabled={pending}
              className="t-label text-mute transition-colors hover:text-bone disabled:opacity-50"
              lang={locale === 'ar' ? 'en' : 'ar'}
            >
              {t.a11y.language}
            </button>
            <Magnetic className="hidden sm:inline-block">
              <a href="/#contact" onClick={go('contact')} className="t-label inline-flex items-center gap-2 border border-line-strong px-4 py-2.5 transition-colors hover:border-accent hover:text-accent">
                <span className="size-1.5 rounded-full bg-accent animate-pulse-dot" />
                {t.hero.talk}
              </a>
            </Magnetic>
            <button type="button" className="t-label lg:hidden" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((v) => !v)}>
              {open ? t.a11y.close : t.a11y.menu}
            </button>
          </div>
        </div>
      </header>

      <div ref={overlay} id="mobile-menu" className="fixed inset-0 z-40 hidden flex-col justify-end bg-coal px-[var(--gutter)] pb-10 pt-28 lg:hidden" style={{ clipPath: 'inset(0 0 100% 0)' }}>
        <ul className="flex flex-col gap-1">
          {SECTIONS.map((id, i) => (
            <li key={id} className="mask w-full border-b border-line">
              <a href={`/#${id}`} onClick={go(id)} className="menu-item flex items-baseline justify-between py-3">
                <span className="t-display">{labels[id]}</span>
                <span className="t-label text-accent">0{i + 1}</span>
              </a>
            </li>
          ))}
          <li className="mask w-full border-b border-line">
            <a href={CLASSIC_URL} target="_blank" rel="noopener noreferrer" className="menu-item flex items-baseline justify-between py-3 text-accent">
              <span className="t-display">{t.nav.classic}</span>
              <span className="t-label">↗</span>
            </a>
          </li>
        </ul>
      </div>
    </>
  )
}
