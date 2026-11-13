'use client'

import { createContext, useCallback, useContext, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LOCALE_COOKIE, getDictionary } from '@/lib/i18n'

const LocaleContext = createContext({ locale: 'en', t: getDictionary('en'), setLocale: () => {}, pending: false })

export function LocaleProvider({ locale, children }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const setLocale = useCallback((next) => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
    // The server re-renders with the new language and <html dir>.
    startTransition(() => router.refresh())
  }, [router])

  return (
    <LocaleContext.Provider value={{ locale, t: getDictionary(locale), setLocale, pending }}>
      {children}
    </LocaleContext.Provider>
  )
}

export const useLocale = () => useContext(LocaleContext)
