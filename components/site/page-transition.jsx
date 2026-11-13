'use client'

import { createContext, forwardRef, useCallback, useContext, useEffect, useRef } from 'react'
import NextLink from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { gsap, prefersReducedMotion } from '@/components/motion/gsap'
import { useSmoothScroll } from '@/components/motion/smooth-scroll'

const TransitionContext = createContext({ navigate: () => {} })

// A curtain wipes across between routes; the accent hairline keeps continuity.
export function PageTransition({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const curtain = useRef(null)
  const busy = useRef(false)
  const first = useRef(true)
  const { lenis } = useSmoothScroll()

  const navigate = useCallback((href) => {
    if (busy.current) return
    const [path, hash] = href.split('#')
    if ((path || '/') === pathname) {
      if (hash) document.getElementById(hash)?.scrollIntoView()
      return
    }
    if (prefersReducedMotion()) {
      router.push(href)
      return
    }
    busy.current = true
    gsap.timeline()
      .set(curtain.current, { display: 'block', clipPath: 'inset(100% 0 0 0)' })
      .to(curtain.current, { clipPath: 'inset(0% 0 0 0)', duration: 0.75, ease: 'expo.inOut' })
      .add(() => router.push(href))
  }, [pathname, router])

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    lenis?.scrollTo(0, { immediate: true })
    if (!busy.current) return
    gsap.timeline({ onComplete: () => { busy.current = false } })
      .to(curtain.current, { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'expo.inOut', delay: 0.15 })
      .set(curtain.current, { display: 'none' })
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <TransitionContext.Provider value={{ navigate }}>
      {children}
      <div ref={curtain} aria-hidden="true" className="fixed inset-0 z-[90] hidden bg-coal">
        <div className="absolute inset-x-0 top-1/2 h-px bg-accent/70" />
        <div className="t-label absolute bottom-8 start-[var(--gutter)] text-mute">Fouad Mohamed</div>
      </div>
    </TransitionContext.Provider>
  )
}

export const usePageTransition = () => useContext(TransitionContext)

// Drop-in for next/link that plays the curtain for internal routes.
export const TransitionLink = forwardRef(function TransitionLink({ href, onClick, children, ...props }, ref) {
  const { navigate } = usePageTransition()
  return (
    <NextLink
      ref={ref}
      href={href}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
        if (props.target === '_blank') return
        e.preventDefault()
        navigate(href)
      }}
      {...props}
    >
      {children}
    </NextLink>
  )
})
