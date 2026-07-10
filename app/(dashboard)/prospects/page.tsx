import { ProspectsPage } from '@/views/ProspectsPage'

export const dynamic = 'force-dynamic'

/**
 * Client-side data fetching via TanStack Query (`useProspectsQuery`). Server
 * prefetch was removed (2026-05-22) because the page-level SQL was blocking
 * the response for minutes when the DB pool / Supabase Admin label lookup was
 * cold — leaving `app/(dashboard)/loading.tsx` pinned indefinitely. The route
 * now streams a tiny shell and the list hydrates as soon as `/api/prospects`
 * resolves, with an in-flight skeleton + abort support handled by React Query.
 */
export default function ProspectsRoute() {
  return <ProspectsPage />
}
