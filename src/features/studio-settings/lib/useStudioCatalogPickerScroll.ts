'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export function studioCatalogPickerRowId(catalogLineId: string) {
  return `studio-catalog-picker-row-${catalogLineId}`
}

/** Scroll a scrollable catalogue picker to a row after React has painted it (e.g. after add). */
export function useStudioCatalogPickerScroll(catalogRevision: unknown) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [pendingRowId, setPendingRowId] = useState<string | null>(null)

  const scrollToCatalogRow = useCallback((catalogLineId: string) => {
    setPendingRowId(catalogLineId)
  }, [])

  useEffect(() => {
    if (!pendingRowId) return
    const rowId = pendingRowId
    let cancelled = false
    let attempts = 0

    const tryScroll = () => {
      if (cancelled) return
      const el = document.getElementById(studioCatalogPickerRowId(rowId))
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        setPendingRowId(null)
        return
      }
      attempts += 1
      if (attempts < 8) requestAnimationFrame(tryScroll)
      else setPendingRowId(null)
    }

    requestAnimationFrame(tryScroll)
    return () => {
      cancelled = true
    }
  }, [pendingRowId, catalogRevision])

  return { scrollRef, scrollToCatalogRow }
}
