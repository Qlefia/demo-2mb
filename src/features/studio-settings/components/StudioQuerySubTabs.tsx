'use client'

import { type ReactNode, useCallback, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { TabBar } from '@/components/molecules/Tabs'

/**
 * One sub-tab inside a Workspace Settings tab (Invoicing / Offer / Proposal).
 *
 * `id` becomes the value of the `?tab=` query param so individual sections
 * are deep-linkable and survive reload, but we don't have to mint a real
 * Next.js route + page for every sub-section the way Sales does.
 */
export type StudioQuerySubTab = {
  id: string
  label: string
  content: ReactNode
}

type Props = {
  tabs: readonly StudioQuerySubTab[]
  /** Defaults to the first tab. */
  defaultTabId?: string
  /** Query param key; defaults to `tab` — only override if the parent tab also uses `?tab=`. */
  queryKey?: string
  /** Accessible label for the nav row. */
  ariaLabel: string
}

export function StudioQuerySubTabs({ tabs, defaultTabId, queryKey = 'tab', ariaLabel }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const resolvedDefault = defaultTabId ?? tabs[0]?.id ?? ''
  const requested = searchParams.get(queryKey)
  const activeId = tabs.some((t) => t.id === requested) ? (requested as string) : resolvedDefault

  const buildHref = useCallback(
    (nextId: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (nextId === resolvedDefault) params.delete(queryKey)
      else params.set(queryKey, nextId)
      const search = params.toString()
      return search ? `${pathname}?${search}` : pathname
    },
    [pathname, searchParams, queryKey, resolvedDefault],
  )

  const handleSelect = useCallback(
    (nextId: string) => {
      if (nextId === activeId) return
      router.replace(buildHref(nextId), { scroll: false })
    },
    [activeId, buildHref, router],
  )

  const activeContent = useMemo(() => tabs.find((t) => t.id === activeId)?.content ?? null, [activeId, tabs])

  const tabItems = useMemo(
    () => tabs.map((tab) => ({ id: tab.id, label: tab.label })),
    [tabs],
  )

  return (
    <div className="space-y-4">
      <TabBar
        items={tabItems}
        selectedId={activeId}
        onChange={handleSelect}
        ariaLabel={ariaLabel}
        variant="section"
        panelIdPrefix="studio-subtab"
      />
      <div
        role="tabpanel"
        id={`studio-subtab-${activeId}`}
        aria-labelledby={`studio-subtab-tab-${activeId}`}
      >
        {activeContent}
      </div>
    </div>
  )
}
