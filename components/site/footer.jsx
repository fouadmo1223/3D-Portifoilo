'use client'

import { ArrowUp } from 'lucide-react'
import { useSmoothScroll } from '@/components/motion/smooth-scroll'
import { useLocale } from './locale-provider'
import { LocalTime } from './local-time'

export function Footer({ name, timezone }) {
  const { t, locale } = useLocale()
  const { scrollTo } = useSmoothScroll()
  return (
    <footer className="relative z-10 border-t border-line bg-ink">
      <div className="wrap t-label flex flex-wrap items-center justify-between gap-6 py-8 text-mute">
        <span>© {new Date().getFullYear()} · {t.footer.rights} {name}</span>
        <span>{t.footer.local} <span className="text-bone"><LocalTime timezone={timezone} locale={locale} /></span></span>
        <button type="button" onClick={() => scrollTo(0)} className="inline-flex items-center gap-2 transition-colors hover:text-bone">
          {t.footer.top}<ArrowUp className="size-3.5" />
        </button>
      </div>
    </footer>
  )
}
