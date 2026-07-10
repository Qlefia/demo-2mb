'use client'

import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { studioRelationListFrame, studioRelationListScroll } from '@/features/studio-settings/studioBlockChrome'
import { cn } from '@/lib/cn'

type StudioRelationListShellProps = {
  selectedCount?: number
  toolbar?: ReactNode
  children: ReactNode
  className?: string
}

export function StudioRelationListShell({
  selectedCount = 0,
  toolbar,
  children,
  className,
}: StudioRelationListShellProps) {
  const { t } = useTranslation()

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col gap-2', className)}>
      {toolbar ? <div className="shrink-0">{toolbar}</div> : null}
      <div className="flex shrink-0 items-center justify-between gap-2 px-0.5">
        <span className="text-[10px] font-medium text-muted">
          {t('studioSettings.relationsSidebar.selectedLabel')}
        </span>
        <span className="text-[10px] font-medium tabular-nums text-muted">{selectedCount}</span>
      </div>
      <div className={studioRelationListFrame}>
        <div className={studioRelationListScroll}>{children}</div>
      </div>
    </div>
  )
}
