import { RouteSkeleton } from '@/components/admin/route-skeleton'

// Lets a page change paint straight away instead of holding the old page until the new one is ready.
export default function PanelLoading() {
  return <RouteSkeleton />
}
