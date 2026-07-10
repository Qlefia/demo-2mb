'use client'

import { type ReactNode } from 'react'
import { useAuth } from './AuthProvider'

// Route-level protection lives in `proxy.ts` (Supabase SSR + Next 16 middleware).
// This client-side guard is a defence-in-depth for Suspense / first-paint flashes:
// while the auth store is hydrating we render nothing instead of an unauthenticated UI.

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isLoading } = useAuth()
  if (isLoading) return null
  return children
}
