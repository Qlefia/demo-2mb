'use client'

import { useTranslation } from 'react-i18next'
import { studioListCardChip } from '@/features/studio-settings/studioBlockChrome'
import { cn } from '@/lib/cn'

export type StudioMetaChipKind = 'group' | 'service'

type StudioLabeledMetaChipProps = {
  kind: StudioMetaChipKind
  name: string
  className?: string
}

export function StudioLabeledMetaChip({ kind, name, className }: StudioLabeledMetaChipProps) {
  const { t } = useTranslation()
  const label = name.trim()
  if (!label) return null

  const prefix =
    kind === 'group'
      ? t('studioSettings.services.metaChipPrefixGroup')
      : t('studioSettings.services.metaChipPrefixService')
  const ariaLabel =
    kind === 'group'
      ? t('studioSettings.services.metaChipAriaGroup', { name: label })
      : t('studioSettings.services.metaChipAriaService', { name: label })

  return (
    <span className={cn(studioListCardChip, className)} title={ariaLabel}>
      <span className="shrink-0 font-normal text-muted">{prefix}</span>
      <span className="shrink-0 text-muted/70" aria-hidden>
        {' · '}
      </span>
      <span className="min-w-0 truncate">{label}</span>
    </span>
  )
}
