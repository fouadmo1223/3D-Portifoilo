import { getSiteData } from '@/lib/data'
import { getLocale } from '@/lib/locale'
import { localizeSite } from '@/lib/localize'
import { Backdrop } from '@/components/three/backdrop'
import { SceneDirector } from '@/components/three/scene-director'
import { HashScroll } from '@/components/site/hash-scroll'
import { Hero } from '@/components/site/hero'
import { About } from '@/components/site/about'
import { Expertise } from '@/components/site/expertise'
import { WorkReel } from '@/components/site/work-reel'
import { Archive } from '@/components/site/archive'
import { Experience } from '@/components/site/experience'
import { Contact } from '@/components/site/contact'
import { Footer } from '@/components/site/footer'

export default async function HomePage() {
  const [data, locale] = await Promise.all([getSiteData(), getLocale()])
  const site = localizeSite(data, locale)

  return (
    <>
      <Backdrop />
      <main id="main" className="relative">
        <Hero profile={site.profile} />
        <About profile={site.profile} />
        <Expertise skills={site.skills} />
        <WorkReel projects={site.reel} />
        <Archive projects={site.projects} />
        <Experience items={site.experience} />
        <Contact profile={site.profile} />
      </main>
      <Footer name={site.profile.name} timezone={site.profile.timezone} />
      <SceneDirector rtl={locale === 'ar'} />
      <HashScroll />
    </>
  )
}
