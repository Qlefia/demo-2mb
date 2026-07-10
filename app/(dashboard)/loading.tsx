import { PageLoadingCenter } from '@/components/atoms'

/**
 * Generic dashboard Suspense fallback. Intentionally minimal: route-specific
 * skeletons can be defined as `loading.tsx` next to each `page.tsx`. The old
 * shimmer "stat cards + grid" mock was misleading on non-dashboard routes
 * (e.g. /prospects) and pinned forever when the upstream server fetch hung.
 */
export default function DashboardLoading() {
  return <PageLoadingCenter />
}
