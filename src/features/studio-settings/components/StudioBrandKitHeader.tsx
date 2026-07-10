'use client'

import { useTranslation } from 'react-i18next'
import { Copy, Trash2 } from 'lucide-react'
import { Badge, IconButton, Input, Label } from '@/components/atoms'
import { Select } from '@/components/molecules/Select'
import { StudioAccentAddButton } from '@/features/studio-settings/components/StudioAccentAddButton'
import { brandKitDisplayName } from '@/features/studio-settings/lib/studioBrandKitHelpers'
import { studioTintPanel } from '@/features/studio-settings/studioBlockChrome'
import { cn } from '@/lib/cn'
import type { StudioBrandProfile } from '@/stores/studioProfileTypes'

type StudioBrandKitHeaderProps = {
  kits: StudioBrandProfile[]
  activeKit: StudioBrandProfile
  activeId: string | null
  draftKitId: string | null
  maxKits: number
  onSelectKit: (id: string) => void
  onNameChange: (name: string) => void
  onAddKit: () => void
  onDuplicateKit: () => void
  onDeleteKit: () => void
  onSetPrimary: () => void
  className?: string
}

export function StudioBrandKitHeader({
  kits,
  activeKit,
  activeId,
  draftKitId,
  maxKits,
  onSelectKit,
  onNameChange,
  onAddKit,
  onDuplicateKit,
  onDeleteKit,
  onSetPrimary,
  className,
}: StudioBrandKitHeaderProps) {
  const { t } = useTranslation()
  const untitled = t('studioSettings.brandKit.untitledKit')
  const isNewDraft = draftKitId === activeKit.id && !activeKit.name.trim()

  const kitOptions = kits.map((b) => ({
    value: b.id,
    label: brandKitDisplayName(b, untitled),
  }))

  const statusHint = isNewDraft
    ? t('studioSettings.brandKit.newKitEditingHint')
    : t('studioSettings.brandKit.editingKitHint', {
        name: brandKitDisplayName(activeKit, untitled),
      })

  return (
    <div className={cn(studioTintPanel, 'space-y-2 p-3', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        {kits.length > 1 ? (
          <div className="w-full shrink-0 sm:w-44">
            <Label className="mb-1 block text-xs text-muted">{t('studioSettings.brandKit.switchKit')}</Label>
            <Select
              value={activeId ?? activeKit.id}
              onChange={onSelectKit}
              options={kitOptions}
              placeholder={t('studioSettings.brandKit.switchKit')}
            />
          </div>
        ) : null}

        <div className="w-full min-w-0 sm:w-56 sm:max-w-xs">
          <Label htmlFor="brand-kit-name" className="mb-1 block text-xs text-muted">
            {t('studioSettings.brandKit.kitNameLabel')}
          </Label>
          <Input
            id="brand-kit-name"
            value={activeKit.name}
            onChange={(e) => onNameChange(e.target.value.slice(0, 200))}
            placeholder={untitled}
          />
        </div>

        <div className="flex w-full flex-wrap items-center gap-1 sm:ml-auto sm:w-auto">
          {isNewDraft ? (
            <Badge variant="info" size="sm">
              {t('studioSettings.brandKit.newKitBadge')}
            </Badge>
          ) : activeKit.isPrimary ? (
            <Badge variant="default" size="sm">
              {t('studioSettings.brandKit.primaryBadge')}
            </Badge>
          ) : null}

          <IconButton
            icon={Copy}
            variant="ghost"
            size="sm"
            label={t('studioSettings.brandKit.duplicateKit')}
            disabled={kits.length >= maxKits}
            onClick={onDuplicateKit}
          />
          <IconButton
            icon={Trash2}
            variant="ghost"
            size="sm"
            label={t('studioSettings.brandKit.deleteKit')}
            disabled={kits.length <= 1}
            onClick={onDeleteKit}
          />
          <StudioAccentAddButton
            type="button"
            disabled={kits.length >= maxKits}
            onClick={onAddKit}
            className="shrink-0"
          >
            {t('studioSettings.brandKit.newKit')}
          </StudioAccentAddButton>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span>{statusHint}</span>
        {!activeKit.isPrimary ? (
          <button type="button" className="underline-offset-2 hover:text-foreground hover:underline" onClick={onSetPrimary}>
            {t('studioSettings.brandKit.setPrimary')}
          </button>
        ) : null}
      </div>
    </div>
  )
}
