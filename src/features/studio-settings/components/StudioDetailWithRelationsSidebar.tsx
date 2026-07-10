'use client'

import type { ReactNode } from 'react'
import type { StudioRelationsEntity } from '@/features/studio-settings/lib/studioRelationsSidebar'
import { StudioRelationsSidebar } from '@/features/studio-settings/components/StudioRelationsSidebar'
import { studioSettingsDetailPad, studioSettingsMainScroll } from '@/features/studio-settings/studioBlockChrome'
import { cn } from '@/lib/cn'

type StudioDetailWithRelationsSidebarProps = {
  entity: StudioRelationsEntity
  children: ReactNode
}

/** Center editor scroll + right relations rail (height from {@link StudioSettingsContent} builder layout). */
export function StudioDetailWithRelationsSidebar({ entity, children }: StudioDetailWithRelationsSidebarProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
      <div className={cn('min-h-0 min-w-0 flex-1', studioSettingsMainScroll, studioSettingsDetailPad)}>
        {children}
      </div>
      <StudioRelationsSidebar entity={entity} />
    </div>
  )
}
