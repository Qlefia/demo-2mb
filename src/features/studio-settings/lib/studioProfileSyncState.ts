/** Module-level sync flags (outside zustand persist). */

import { useSyncExternalStore } from 'react'

let applyingRemote = false
let syncEnabled = false
let hasHydrated = false
let lastAppliedRevision = 0
let lastPushedRevision = 0

const listeners = new Set<() => void>()
function notify() {
  for (const listener of listeners) listener()
}
function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function studioProfileSyncIsApplyingRemote(): boolean {
  return applyingRemote
}

export function studioProfileSyncSetApplyingRemote(value: boolean): void {
  applyingRemote = value
}

export function studioProfileSyncIsEnabled(): boolean {
  return syncEnabled
}

export function studioProfileSyncSetEnabled(value: boolean): void {
  if (syncEnabled === value) return
  syncEnabled = value
  notify()
}

export function studioProfileSyncHasHydrated(): boolean {
  return hasHydrated
}

export function studioProfileSyncSetHasHydrated(value: boolean): void {
  if (hasHydrated === value) return
  hasHydrated = value
  notify()
}

/**
 * React hook — re-renders when the studio sync flips between "loading" and
 * "ready". Components that read straight from the Zustand store should
 * suspend their empty states behind this so the UI doesn't briefly show
 * "No groups yet" while the first GET is in flight.
 */
export function useStudioProfileReady(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => hasHydrated,
    () => false,
  )
}

export function studioProfileSyncLastAppliedRevision(): number {
  return lastAppliedRevision
}

export function studioProfileSyncSetLastAppliedRevision(revision: number): void {
  lastAppliedRevision = revision
}

export function studioProfileSyncLastPushedRevision(): number {
  return lastPushedRevision
}

export function studioProfileSyncSetLastPushedRevision(revision: number): void {
  lastPushedRevision = revision
}
