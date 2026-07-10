'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { StudioSectionsCollapseIconButton } from '@/features/studio-settings/components/StudioCollapsibleSectionsToolbar'
import {
  studioSalesDetailHeaderBack,
  studioSalesDetailHeaderTitle,
  studioWorkDetailStickyBar,
} from '@/features/studio-settings/studioBlockChrome'
import { cn } from '@/lib/cn'

export type StudioWorkDetailStickyBarProps = {
  backHref: string
  title: string
  sectionsCollapse?: {
    allExpanded: boolean
    onToggleAll: () => void
    expandLabel: string
    collapseLabel: string
  }
}

export function StudioWorkDetailStickyBar({
  backHref,
  title,
  sectionsCollapse,
}: StudioWorkDetailStickyBarProps) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(studioWorkDetailStickyBar, sectionsCollapse && 'justify-between')}
      role="region"
      aria-label={t('studioSettings.works.stickyBarAria')}
    >
      <Link href={backHref} className={studioSalesDetailHeaderBack} aria-label={t('studioSettings.backToWorks')}>
        <ArrowLeft size={16} aria-hidden />
      </Link>
      <p className={studioSalesDetailHeaderTitle} title={title}>
        {title}
      </p>
      {sectionsCollapse ? (
        <div className="ml-auto flex shrink-0 items-center">
          <StudioSectionsCollapseIconButton
            allExpanded={sectionsCollapse.allExpanded}
            onToggleAll={sectionsCollapse.onToggleAll}
            expandLabel={sectionsCollapse.expandLabel}
            collapseLabel={sectionsCollapse.collapseLabel}
          />
        </div>
      ) : null}
    </div>
  )
}
