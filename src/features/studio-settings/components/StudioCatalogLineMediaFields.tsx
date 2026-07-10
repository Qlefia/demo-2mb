'use client'

import { useTranslation } from 'react-i18next'
import { StudioDualImageUpload } from '@/features/studio-settings/components/StudioDualImageUpload'
import { StudioFieldHeader } from '@/features/studio-settings/components/StudioFieldHeader'
import type { StudioServiceCatalogItem } from '@/stores/studioProfileTypes'

type StudioCatalogLineMediaFieldsProps = {
  row: StudioServiceCatalogItem
  onPatch: (patch: Partial<StudioServiceCatalogItem>) => void
}

export function StudioCatalogLineMediaFields({ row, onPatch }: StudioCatalogLineMediaFieldsProps) {
  const { t } = useTranslation()

  return (
    <div className="studio-field-stack">
      <StudioFieldHeader
        label={t('studioSettings.services.lineMediaLabel')}
        hint={t('studioSettings.services.lineMediaHint')}
        showAi={false}
      />
      <StudioDualImageUpload
        horizontalValue={row.mediaDataUrl}
        portraitValue={row.mediaPortraitDataUrl}
        onHorizontalChange={(v) => onPatch({ mediaDataUrl: v, mediaMode: 'image' })}
        onPortraitChange={(v) => onPatch({ mediaPortraitDataUrl: v, mediaMode: 'image' })}
      />
    </div>
  )
}
