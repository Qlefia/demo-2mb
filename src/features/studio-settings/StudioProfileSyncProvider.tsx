'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useStudioProfileSync } from '@/features/studio-settings/lib/useStudioProfileSync'
import { useAuth } from '@/providers/AuthProvider'

type StudioProfileSyncProviderProps = {
  children: ReactNode
}

/** Enables Supabase-backed auto-save + Realtime for `/settings/studio` routes. */
export function StudioProfileSyncProvider({ children }: StudioProfileSyncProviderProps) {
  const pathname = usePathname()
  const { user, isLoading } = useAuth()
  const studioRoute = pathname.startsWith('/settings/studio')
  const active = studioRoute && !isLoading && Boolean(user)

  useStudioProfileSync(active)

  return children
}
