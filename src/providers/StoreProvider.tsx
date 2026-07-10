'use client'

import { useEffect, type ReactNode } from 'react'
import { useProspectStore } from '@/stores/prospectStore'
import { useHydration } from '@/hooks/useHydration'

export function StoreProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    useProspectStore.persist.rehydrate()
  }, [])

  const hydrated = useHydration()
  if (!hydrated) return null
  return children
}
