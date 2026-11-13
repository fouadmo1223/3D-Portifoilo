'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowUpRight, SlidersHorizontal, X } from 'lucide-react'
import { Img as Image } from '@/components/site/img'
import { gsap, useGSAP, prefersReducedMotion } from '@/components/motion/gsap'
import { useLocale } from './locale-provider'
import { TransitionLink } from './page-transition'

const PAGE = 12

// Stack groups, in the order the original portfolio listed them.
const STACKS = [
  ['react', 'React'], ['html', 'HTML & CSS'], ['next', 'Next.js'], ['php', 'PHP'], ['node', 'Node.js'],
  ['nest', 'NestJS'], ['zid', 'Zid'], ['astro', 'Astro'], ['reactnative', 'React Native'],
]

const KNOWN = new Set(STACKS.map(([key]) => key))
// Label for a filter added in the admin: "vue-js" -> "Vue Js".
const labelFor = (key) => key.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

function FilterRow({ filter, active, onSelect, layoutId }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(filter.key)}
      aria-pressed={active}
      className="group relative flex w-full items-center justify-between border-b border-line py-3 text-start"
    >
      {active && <motion.span layoutId={layoutId} transition={{ type: 'spring', stiffness: 380, damping: 32 }} className="absolute inset-y-0 start-0 w-0.5 bg-accent" />}
      <span className={`t-label ps-4 transition-colors ${active ? 'text-accent' : 'text-mute group-hover:text-bone'}`}>{filter.label}</span>
      <span className={`t-label tabular-nums transition-colors ${active ? 'text-accent' : 'text-faint group-hover:text-mute'}`}>{String(filter.count).padStart(2, '0')}</span>
    </button>
  )
}

// Every project, filtered by stack: a vertical filter list on desktop, a drawer on phones.
// On desktop a preview image follows the cursor.
export function Archive({ projects }) {
  const { t } = useLocale()
  const root = useRef(null)
  const preview = useRef(null)
  const [showAll, setShowAll] = useState(false)
  const [hovered, setHovered] = useState(null)
  const [drawer, setDrawer] = useState(false)

  const filters = useMemo(() => [
    ...[...STACKS, ...[...new Set(projects.flatMap((p) => p.filters))].filter((k) => !KNOWN.has(k)).sort().map((k) => [k, labelFor(k)])].map(([key, label]) => ({ key, label, count: projects.filter((p) => p.filters.includes(key)).length })).filter((f) => f.count > 0),
    { key: 'all', label: t.work.all, count: projects.length },
  ], [projects, t.work.all])
  const [filter, setFilter] = useState(() => filters[0].key)
  const current = filters.find((f) => f.key === filter) ?? filters[0]
  const filtered = current.key === 'all' ? projects : projects.filter((p) => p.filters.includes(current.key))
  const visible = showAll ? filtered : filtered.slice(0, PAGE)
  const select = (key) => { setFilter(key); setShowAll(false); setDrawer(false) }

  useGSAP(() => {
    if (prefersReducedMotion() || !window.matchMedia('(pointer: fine)').matches) return
    const x = gsap.quickTo(preview.current, 'x', { duration: 0.6, ease: 'power3' })
    const y = gsap.quickTo(preview.current, 'y', { duration: 0.6, ease: 'power3' })
    const move = (e) => { x(e.clientX + 24); y(e.clientY - 120) }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, { scope: root })

  useGSAP(() => {
    gsap.to(preview.current, {
      clipPath: hovered ? 'inset(0% 0% 0% 0%)' : 'inset(50% 50% 50% 50%)',
      duration: prefersReducedMotion() ? 0 : 0.6,
      ease: 'expo.out',
    })
  }, { dependencies: [hovered] })

  useEffect(() => {
    if (!drawer) return
    const esc = (e) => e.key === 'Escape' && setDrawer(false)
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [drawer])

  if (!projects.length) return null

  return (
    <section ref={root} aria-labelledby="archive-title" className="relative z-10 border-t border-line bg-ink py-[14vh]">
      <div className="wrap">
        <p className="t-label text-mute">{t.work.archive}</p>
        <h2 id="archive-title" className="t-title mt-4">{t.work.archiveTitle} <sup className="t-mono text-accent">{projects.length}</sup></h2>

        <div className="mt-12 grid gap-x-14 gap-y-8 md:grid-cols-[15rem_1fr]">
          {/* Desktop: editorial vertical filter list */}
          <div role="toolbar" aria-label={t.work.filter} aria-orientation="vertical" className="hidden self-start md:sticky md:top-28 md:block">
            <span className="t-label block pb-2 ps-4 text-faint">{t.work.filter}</span>
            {filters.map((f) => <FilterRow key={f.key} filter={f} active={f.key === current.key} onSelect={select} layoutId="filter-bar" />)}
          </div>

          {/* Phones: compact trigger that opens a drawer */}
          <button type="button" onClick={() => setDrawer(true)} aria-haspopup="dialog" className="t-label flex w-full items-center justify-between border border-line px-4 py-3 md:hidden">
            <span className="flex items-center gap-2"><SlidersHorizontal size={14} />{current.label}</span>
            <span className="tabular-nums text-mute">{String(current.count).padStart(2, '0')}</span>
          </button>

          <div role="table" aria-label={t.work.archiveTitle}>
            <div role="row" className="t-label hidden grid-cols-[3rem_1.6fr_1.4fr_4rem_2rem] gap-6 border-b border-line pb-3 text-faint lg:grid">
              <span role="columnheader">{t.work.index}</span>
              <span role="columnheader">{t.work.project}</span>
              <span role="columnheader">{t.work.stack}</span>
              <span role="columnheader">{t.work.year}</span>
              <span />
            </div>
            {visible.length === 0 && <p className="py-10 text-mute">{t.work.empty}</p>}
            {visible.map((p, i) => (
              <div role="row" key={p.id}>
                <TransitionLink
                  href={`/work/${p.slug}`}
                  onPointerEnter={() => setHovered(p)}
                  onPointerLeave={() => setHovered(null)}
                  className="group grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-4 border-b border-line py-5 transition-colors hover:bg-coal lg:grid-cols-[3rem_1.6fr_1.4fr_4rem_2rem] lg:gap-6"
                >
                  <span role="cell" className="t-mono text-faint group-hover:text-accent">{String(i + 1).padStart(2, '0')}</span>
                  <span role="cell" className="font-display text-2xl leading-tight transition-transform duration-500 ease-[var(--ease-out)] group-hover:translate-x-2 rtl:group-hover:-translate-x-2 lg:text-3xl">{p.title}</span>
                  <span role="cell" className="t-mono hidden truncate text-mute lg:block" dir="ltr">{p.technologies.slice(0, 3).join(' / ')}</span>
                  <span role="cell" className="t-mono hidden text-mute lg:block">{p.year ?? '—'}</span>
                  <ArrowUpRight className="size-4 text-faint transition-colors group-hover:text-accent rtl:-scale-x-100" />
                </TransitionLink>
              </div>
            ))}
            {filtered.length > PAGE && (
              <button type="button" onClick={() => setShowAll((v) => !v)} className="t-label link-line mt-10 text-bone">
                {showAll ? '—' : `+ ${filtered.length - PAGE}`}
              </button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {drawer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-ink/70 md:hidden" onClick={() => setDrawer(false)} />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={t.work.filter}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed inset-x-0 bottom-0 z-[71] max-h-[80svh] overflow-y-auto border-t border-line bg-coal p-6 pb-8 md:hidden"
              data-lenis-prevent
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="t-label text-mute">{t.work.filter}</span>
                <button type="button" onClick={() => setDrawer(false)} aria-label={t.a11y.close} className="text-mute hover:text-bone"><X size={20} /></button>
              </div>
              {filters.map((f) => <FilterRow key={f.key} filter={f} active={f.key === current.key} onSelect={select} layoutId="filter-bar-drawer" />)}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div
        ref={preview}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-30 hidden aspect-[16/10] w-[300px] overflow-hidden bg-coal md:block"
        style={{ clipPath: 'inset(50% 50% 50% 50%)' }}
      >
        {hovered && <Image src={hovered.thumbnail} alt="" fill sizes="300px" className="object-cover object-top" />}
      </div>
    </section>
  )
}
