'use client'

import type { ReactNode } from 'react'
import { SortableFieldRows } from '@/features/proposals/SortableFieldRows'
import { StudioSalesListLayoutProvider } from '@/features/studio-settings/lib/StudioSalesListLayoutContext'
import { studioSortableStack } from '@/features/studio-settings/studioBlockChrome'
import { cn } from '@/lib/cn'

const STATIC_DRAG_SPACER = <span className="w-6 shrink-0" aria-hidden />

type StudioSalesListLayoutProps = {
  blockId: string
  itemIds: readonly string[]
  listLabel: string
  viewMode: 'list' | 'card' | 'kanban'
  isManualOrder: boolean
  onReorder: (nextIds: string[]) => void
  alignStart?: boolean
  children: (id: string, dragHandle: ReactNode) => ReactNode
}

export function StudioSalesListLayout({
  blockId,
  itemIds,
  listLabel,
  viewMode,
  isManualOrder,
  onReorder,
  alignStart,
  children,
}: StudioSalesListLayoutProps) {
  if (viewMode === 'card') {
    return (
      <StudioSalesListLayoutProvider layout="grid">
        <ul className="grid list-none gap-2 sm:grid-cols-2" aria-label={listLabel}>
          {itemIds.map((id) => (
            <li key={id} className="min-w-0">
              {children(id, STATIC_DRAG_SPACER)}
            </li>
          ))}
        </ul>
      </StudioSalesListLayoutProvider>
    )
  }

  if (isManualOrder) {
    return (
      <StudioSalesListLayoutProvider layout="list">
        <SortableFieldRows
          blockId={blockId}
          itemIds={[...itemIds]}
          onReorder={onReorder}
          listLabel={listLabel}
          alignStart={alignStart}
          containerClassName={studioSortableStack}
        >
          {children}
        </SortableFieldRows>
      </StudioSalesListLayoutProvider>
    )
  }

  return (
    <StudioSalesListLayoutProvider layout="list">
      <ul className={cn(studioSortableStack, 'list-none')} aria-label={listLabel}>
        {itemIds.map((id) => (
          <li key={id} className="min-w-0">
            {children(id, STATIC_DRAG_SPACER)}
          </li>
        ))}
      </ul>
    </StudioSalesListLayoutProvider>
  )
}
