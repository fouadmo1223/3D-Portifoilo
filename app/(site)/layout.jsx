import { getLocale } from '@/lib/locale'
import { LocaleProvider } from '@/components/site/locale-provider'
import { SmoothScroll } from '@/components/motion/smooth-scroll'
import { PageTransition } from '@/components/site/page-transition'
import { Loader } from '@/components/site/loader'
import { Cursor } from '@/components/site/cursor'
import { ScrollProgress } from '@/components/site/scroll-progress'
import { Nav } from '@/components/site/nav'
import { Chatbot } from '@/components/site/chatbot'

export default async function SiteLayout({ children }) {
  const locale = await getLocale()
  return (
    <LocaleProvider locale={locale}>
      <SmoothScroll>
        <PageTransition>
          <div className="grain">
            <Loader />
            <Cursor />
            <ScrollProgress />
            <Nav />
            {children}
            <Chatbot />
          </div>
        </PageTransition>
      </SmoothScroll>
    </LocaleProvider>
  )
}
