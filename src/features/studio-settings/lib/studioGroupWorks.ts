import { STUDIO_WORK_TEXT_LIMITS } from '@/features/studio-settings/constants'
import type { StudioWork } from '@/stores/studioProfileTypes'

/** Work is tied to a group when it shares at least one catalogue line with the group's bundle. */
export function workIsLinkedToServiceGroup(
  work: StudioWork,
  memberIds: readonly string[],
): boolean {
  if (memberIds.length === 0) return false
  const memberSet = new Set(memberIds)
  return work.linkedCatalogIds.some((cid) => memberSet.has(cid))
}

export function worksLinkedToServiceGroup(
  works: readonly StudioWork[],
  memberIds: readonly string[],
): StudioWork[] {
  return works.filter((w) => workIsLinkedToServiceGroup(w, memberIds))
}

export function selectedWorkIdsForServiceGroup(
  works: readonly StudioWork[],
  memberIds: readonly string[],
): string[] {
  return worksLinkedToServiceGroup(works, memberIds).map((w) => w.id)
}

export function countWorksLinkedToServiceGroup(
  works: readonly StudioWork[],
  memberIds: readonly string[],
): number {
  return selectedWorkIdsForServiceGroup(works, memberIds).length
}

/** Toggle a catalogue bundle on any entity that stores `linkedCatalogIds` (work, segment). */
export function toggleLinkedCatalogBundle(
  linkedCatalogIds: readonly string[],
  memberIds: readonly string[],
): string[] {
  return toggleWorkServiceGroupLink({ linkedCatalogIds: [...linkedCatalogIds] } as StudioWork, memberIds)
}

export function canLinkLinkedCatalogBundle(
  linkedCatalogIds: readonly string[],
  memberIds: readonly string[],
): boolean {
  return canLinkWorkToServiceGroup({ linkedCatalogIds: [...linkedCatalogIds] } as StudioWork, memberIds)
}

export function isLinkedToCatalogBundle(
  linkedCatalogIds: readonly string[],
  memberIds: readonly string[],
): boolean {
  return workIsLinkedToServiceGroup({ linkedCatalogIds: [...linkedCatalogIds] } as StudioWork, memberIds)
}

export function toggleWorkServiceGroupLink(
  work: StudioWork,
  memberIds: readonly string[],
): string[] {
  const memberSet = new Set(memberIds)
  if (memberIds.length === 0) return work.linkedCatalogIds

  const linked = workIsLinkedToServiceGroup(work, memberIds)
  if (linked) {
    return work.linkedCatalogIds.filter((cid) => !memberSet.has(cid))
  }

  const max = STUDIO_WORK_TEXT_LIMITS.maxLinkedCatalogIds
  const toAdd = memberIds.filter((cid) => !work.linkedCatalogIds.includes(cid))
  const room = Math.max(0, max - work.linkedCatalogIds.length)
  if (room === 0) return work.linkedCatalogIds
  return [...work.linkedCatalogIds, ...toAdd.slice(0, room)]
}

export function canLinkWorkToServiceGroup(
  work: StudioWork,
  memberIds: readonly string[],
): boolean {
  if (memberIds.length === 0) return false
  if (workIsLinkedToServiceGroup(work, memberIds)) return true
  const missing = memberIds.filter((cid) => !work.linkedCatalogIds.includes(cid))
  if (missing.length === 0) return true
  const room = STUDIO_WORK_TEXT_LIMITS.maxLinkedCatalogIds - work.linkedCatalogIds.length
  return room > 0
}
