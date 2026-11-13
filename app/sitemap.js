import { getPublishedSlugs } from '@/lib/data'

const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3100'

export default async function sitemap() {
  let projects = []
  try { projects = await getPublishedSlugs() } catch {}
  return [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    ...projects.map((p) => ({ url: `${base}/work/${p.slug}`, lastModified: p.updatedAt, priority: 0.7 })),
  ]
}
