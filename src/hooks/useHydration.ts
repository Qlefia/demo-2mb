'use client'

import { useSyncExternalStore } from 'react'
import { useProspectStore } from '@/stores/prospectStore'

const PERSISTED_STORES = [useProspectStore] as const

function subscribe(onStoreChange: () => void) {
  const unsubs = PERSISTED_STORES.map((store) =>
    store.persist.onFinishHydration(onStoreChange),
  )
  return () => unsubs.forEach((unsub) => unsub())
}

function getSnapshot() {
  return PERSISTED_STORES.every((store) => store.persist.hasHydrated())
}

function getServerSnapshot() {
  return false
}

export function useHydration() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
