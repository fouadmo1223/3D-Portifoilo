'use client'

import { usePathname } from 'next/navigation'
import { RESOURCES } from './config'
import { FormSkeleton, ListSkeleton, OverviewSkeleton, Skeleton } from './skeleton'

// The heading row every list page has, so the cards below do not jump when it arrives.
const ListHeader = () => (
  <div aria-hidden="true" className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div>
      <Skeleton className="h-7 w-36" />
      <Skeleton className="mt-2.5 h-3 w-16" />
    </div>
    <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
      <Skeleton className="h-10 w-full !rounded-lg sm:w-72" />
      <Skeleton className="h-10 w-32 !rounded-lg" />
    </div>
  </div>
)

// Shown the moment an admin link is clicked, shaped like the page that is on its way.
export function RouteSkeleton() {
  const [, , section, id] = usePathname().split('/') // /admin/<section>/<id>
  if (!section) {
    return (
      <div>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-8 w-72 max-w-full" />
        <OverviewSkeleton />
      </div>
    )
  }
  if (id || section === 'profile') return <FormSkeleton />
  const cfg = RESOURCES[section]
  const grid = cfg?.layout === 'grid'
  return (
    <div>
      <ListHeader />
      <ListSkeleton grid={grid} rows={grid ? 6 : 8} image={Boolean(cfg?.image)} single={section === 'messages'} label="Loading the page…" />
    </div>
  )
}
