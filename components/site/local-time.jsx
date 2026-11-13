'use client'

import { useEffect, useState } from 'react'

// Live clock in the profile's timezone (renders nothing until mounted to avoid hydration drift).
export function LocalTime({ timezone = 'Africa/Cairo', locale = 'en' }) {
  const [now, setNow] = useState(null)
  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 15_000)
    return () => clearInterval(id)
  }, [])
  if (!now) return <span className="inline-block w-[5ch]" />
  return (
    <time dateTime={now.toISOString()} className="tabular-nums">
      {new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-GB', { hour: '2-digit', minute: '2-digit', timeZone: timezone }).format(now)}
    </time>
  )
}
