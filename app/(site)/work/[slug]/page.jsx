import { notFound } from 'next/navigation'
import { Img as Image } from '@/components/site/img'
import { ArrowUpRight } from 'lucide-react'
import { getProject } from '@/lib/data'
import { getLocale } from '@/lib/locale'
import { getDictionary, pick, pickList } from '@/lib/i18n'
import { TransitionLink } from '@/components/site/page-transition'
import { ProjectIntro } from '@/components/site/project-intro'
import { Footer } from '@/components/site/footer'
import { FALLBACK_PROFILE } from '@/lib/data'

export async function generateMetadata({ params }) {
  const { slug } = await params
  const [data, locale] = await Promise.all([getProject(slug), getLocale()])
  if (!data) return { title: 'Not found' }
  const { project } = data
  return {
    title: pick(project.title, locale),
    description: pick(project.shortDescription, locale) || undefined,
    openGraph: { images: [{ url: project.thumbnail }] },
  }
}

export default async function ProjectPage({ params }) {
  const { slug } = await params
  const [data, locale] = await Promise.all([getProject(slug), getLocale()])
  if (!data) notFound()
  const { project, next } = data
  const t = getDictionary(locale)
  const title = pick(project.title, locale)
  const description = pick(project.description, locale)
  const features = pickList(project.features, locale)
  const meta = [
    [t.project.role, project.category],
    [t.work.year, project.year ?? '—'],
    [t.project.tech, project.technologies.join(' / ')],
  ]

  return (
    <>
      <div aria-hidden="true" className="backdrop-fallback fixed inset-0 z-0" />
      <main id="main" className="relative z-10">
        <ProjectIntro>
          <div className="wrap pt-32 md:pt-40">
            <TransitionLink href="/#work" className="t-label link-line text-mute">← {t.project.back}</TransitionLink>
            <h1 className="t-hero intro-title mt-10 max-w-[12ch] text-[clamp(3rem,10vw,10rem)]">
              <span className="mask"><span className="split-item">{title}</span></span>
            </h1>
            <dl className="intro-fade mt-12 grid gap-6 border-t border-line pt-6 sm:grid-cols-2 lg:grid-cols-4">
              {meta.map(([k, v]) => (
                <div key={k}>
                  <dt className="t-label text-faint">{k}</dt>
                  <dd className="t-mono mt-2 text-bone/85" dir="ltr">{v}</dd>
                </div>
              ))}
              <div className="flex flex-col gap-2">
                {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noreferrer" className="t-label link-line inline-flex w-fit items-center gap-2 text-accent">{t.work.live}<ArrowUpRight className="size-3.5 rtl:-scale-x-100" /></a>}
                {project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noreferrer" className="t-label link-line inline-flex w-fit items-center gap-2">{t.work.code}<ArrowUpRight className="size-3.5 rtl:-scale-x-100" /></a>}
              </div>
            </dl>
          </div>
          <div className="wrap mt-14">
            <div className="intro-cover relative aspect-[16/9] overflow-hidden bg-coal">
              <Image src={project.thumbnail} alt={title} fill priority sizes="(max-width: 1600px) 100vw, 1600px" className="object-cover object-top" />
            </div>
          </div>
        </ProjectIntro>

        <section className="wrap grid gap-12 py-[14vh] lg:grid-cols-12">
          <h2 className="t-label text-mute lg:col-span-3">{t.project.overview}</h2>
          <div className="lg:col-span-8">
            {description.split(/\n+/).map((para, i) => (
              <p key={i} className={i === 0 ? 't-lead' : 'mt-6 max-w-[62ch] text-lg text-bone/80'}>{para}</p>
            ))}
            {features.length > 0 && (
              <>
                <h3 className="t-label mt-16 text-mute">{t.project.features}</h3>
                <ul className="mt-6 border-t border-line">
                  {features.map((f, i) => (
                    <li key={f} className="grid grid-cols-[3rem_1fr] gap-4 border-b border-line py-4">
                      <span className="t-mono text-accent">{String(i + 1).padStart(2, '0')}</span>
                      <span className="text-bone/85">{f}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>

        {project.gallery.length > 0 && (
          <section className="wrap pb-[14vh]" aria-label={t.project.gallery}>
            <div className="grid gap-6 md:grid-cols-2">
              {project.gallery.map((src, i) => (
                <div key={src} className={`relative overflow-hidden bg-coal ${i % 3 === 0 ? 'aspect-[16/9] md:col-span-2' : 'aspect-[4/3]'}`}>
                  <Image src={src} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover object-top" />
                </div>
              ))}
            </div>
          </section>
        )}

        {next && (
          <section className="border-t border-line bg-ink">
            <TransitionLink href={`/work/${next.slug}`} className="wrap group grid items-center gap-8 py-[12vh] md:grid-cols-12" data-cursor={t.work.view}>
              <div className="md:col-span-7">
                <p className="t-label text-mute">{t.project.next}</p>
                <p className="t-display mt-6 transition-colors duration-500 group-hover:text-accent">{pick(next.title, locale)}</p>
              </div>
              <div className="relative aspect-[16/10] overflow-hidden bg-coal md:col-span-5">
                <Image src={next.thumbnail} alt="" fill sizes="40vw" className="object-cover object-top transition-transform duration-[1.4s] ease-[var(--ease-out)] group-hover:scale-105" />
              </div>
            </TransitionLink>
          </section>
        )}
      </main>
      <Footer name={pick(FALLBACK_PROFILE.name, locale)} timezone={FALLBACK_PROFILE.timezone} />
    </>
  )
}
