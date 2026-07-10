'use client'

import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { ImageUpload } from '@/components/molecules/ImageUpload'
import {
  pickStudioProfileImageUrl,
  removeStudioProfileImageUrl,
} from '@/features/studio-settings/lib/studioProfileImagePick'
import { studioDualImageUploadGrid } from '@/features/studio-settings/studioBlockChrome'

export type StudioDualImageUploadProps = {
  horizontalValue: string | null
  portraitValue: string | null
  onHorizontalChange: (value: string | null) => void
  onPortraitChange: (value: string | null) => void
  horizontalPlaceholder?: string
  portraitPlaceholder?: string
}

/** Horizontal 16:9 + vertical 3:4 — groups, services, works, reviews, segments. */
export function StudioDualImageUpload({
  horizontalValue,
  portraitValue,
  onHorizontalChange,
  onPortraitChange,
  horizontalPlaceholder,
  portraitPlaceholder,
}: StudioDualImageUploadProps) {
  const { t } = useTranslation()

  const uploadHorizontal = useCallback(
    async (file: File) => pickStudioProfileImageUrl(file, t, horizontalValue),
    [horizontalValue, t],
  )
  const uploadPortrait = useCallback(
    async (file: File) => pickStudioProfileImageUrl(file, t, portraitValue),
    [portraitValue, t],
  )

  const onHorizontalClear = useCallback(
    (next: string | null) => {
      if (next === null) void removeStudioProfileImageUrl(horizontalValue)
      onHorizontalChange(next)
    },
    [horizontalValue, onHorizontalChange],
  )

  const onPortraitClear = useCallback(
    (next: string | null) => {
      if (next === null) void removeStudioProfileImageUrl(portraitValue)
      onPortraitChange(next)
    },
    [onPortraitChange, portraitValue],
  )

  return (
    <div className={studioDualImageUploadGrid}>
      <div className="studio-field-stack shrink-0">
        <span className="text-xs font-medium text-muted">
          {t('studioSettings.services.lineMediaHorizontalLabel')}
        </span>
        <ImageUpload
          value={horizontalValue}
          onChange={onHorizontalClear}
          aspect="16:9"
          cap="dualHero"
          placeholder={horizontalPlaceholder ?? t('studioSettings.services.lineMediaImagePlaceholder')}
          onUpload={uploadHorizontal}
        />
      </div>
      <div className="studio-field-stack shrink-0">
        <span className="text-xs font-medium text-muted">
          {t('studioSettings.services.lineMediaPortraitLabel')}
        </span>
        <ImageUpload
          value={portraitValue}
          onChange={onPortraitClear}
          aspect="3:4"
          cap="dualPortrait"
          placeholder={portraitPlaceholder ?? t('studioSettings.services.lineMediaPortraitPlaceholder')}
          onUpload={uploadPortrait}
        />
      </div>
    </div>
  )
}
