// Placeholder shapes shown while admin data loads. They mirror the real layout so
// nothing jumps when the content arrives.
export const Skeleton = ({ className = '' }) => <span aria-hidden="true" className={`admin-skeleton block ${className}`} />

function Busy({ label, children, className = '' }) {
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}

// Widths cycle so the rows do not look like a barcode.
const TITLE = ['w-2/5', 'w-1/3', 'w-1/2', 'w-1/4', 'w-3/5']
const SUB = ['w-3/5', 'w-1/2', 'w-2/3', 'w-2/5', 'w-1/3']

export function ListSkeleton({ rows = 8, image = false, grid = false, single = false, label = 'Loading…', className = '' }) {
  if (grid) {
    return (
      <Busy label={label} className={className}>
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: rows }, (_, i) => (
            <li key={i} className="admin-card overflow-hidden">
              <Skeleton className="aspect-[16/10] w-full !rounded-none" />
              <div className="px-4 pb-4 pt-4">
                <Skeleton className={`h-4 ${TITLE[i % TITLE.length]}`} />
                <Skeleton className={`mt-2.5 h-3 ${SUB[i % SUB.length]}`} />
                <div className="mt-4 flex justify-between border-t border-line pt-3">
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Busy>
    )
  }
  return (
    <Busy label={label} className={className}>
      <ul className={`grid gap-3 ${single ? '' : 'lg:grid-cols-2'}`}>
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="admin-card flex items-center gap-3 px-3 py-3">
            {!single && <Skeleton className="h-8 w-4" />}
            {image && <Skeleton className="size-11 shrink-0 !rounded-lg" />}
            <span className="min-w-0 flex-1 py-1">
              <Skeleton className={`h-3.5 ${TITLE[i % TITLE.length]}`} />
              <Skeleton className={`mt-2 h-3 ${SUB[i % SUB.length]}`} />
            </span>
            <Skeleton className="h-6 w-20 shrink-0" />
          </li>
        ))}
      </ul>
    </Busy>
  )
}

export function FormSkeleton({ sections = 3 }) {
  return (
    <Busy label="Loading the editor…" className="mx-auto max-w-4xl pb-24">
      <div className="mb-8">
        <Skeleton className="mb-3 h-3 w-24" />
        <Skeleton className="h-7 w-64 max-w-full" />
      </div>
      <div className="space-y-6">
        {Array.from({ length: sections }, (_, s) => (
          <div key={s} className="admin-card overflow-hidden" style={{ opacity: 1 - s * 0.22 }}>
            <div className="border-b border-line px-5 py-4"><Skeleton className="h-2.5 w-28" /></div>
            <div className="grid gap-5 p-5 md:grid-cols-2">
              {[0, 1, 2, 3].map((f) => (
                <div key={f} className={f === 2 ? 'md:col-span-2' : ''}>
                  <Skeleton className="mb-2 h-3 w-24" />
                  <Skeleton className={f === 2 ? 'h-24 w-full' : 'h-10 w-full'} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Busy>
  )
}

export function OverviewSkeleton() {
  return (
    <Busy label="Loading the overview…">
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <li key={i} className="admin-card p-5">
            <Skeleton className="size-9 !rounded-lg" />
            <Skeleton className="mt-5 h-9 w-16" />
            <Skeleton className="mt-3 h-3 w-20" />
            <Skeleton className="mt-2 h-3 w-32" />
          </li>
        ))}
      </ul>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <div className="admin-card p-5">
          <Skeleton className="h-2.5 w-24" />
          {[0, 1, 2].map((i) => <Skeleton key={i} className="mt-3 h-11 w-full !rounded-lg" />)}
        </div>
        <div className="admin-card p-5">
          <Skeleton className="h-2.5 w-32" />
          {[0, 1, 2].map((i) => <Skeleton key={i} className="mt-3 h-11 w-full !rounded-lg" />)}
        </div>
      </div>
    </Busy>
  )
}
