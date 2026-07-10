'use client'

import { useTranslation } from 'react-i18next'
import { Trash2 } from 'lucide-react'
import { IconButton, Input } from '@/components/atoms'
import { ImageUpload } from '@/components/molecules/ImageUpload'
import { Select } from '@/components/molecules/Select'
import { StudioListAddButton } from '@/features/studio-settings/components/StudioListAddButton'
import { studioTintPanel } from '@/features/studio-settings/studioBlockChrome'
import { cn } from '@/lib/cn'
import {
  pickStudioProfileImageUrl,
  removeStudioProfileImageUrl,
} from '@/features/studio-settings/lib/studioProfileImagePick'
import { studioBrandKitNewId } from '@/features/studio-settings/lib/studioBrandKitHelpers'
import { STUDIO_BRAND_LOGO_ROLES, type StudioBrandLogo, type StudioBrandLogoRole } from '@/stores/studioProfileTypes'

type StudioBrandLogosEditorProps = {
  logos: StudioBrandLogo[]
  onChange: (logos: StudioBrandLogo[]) => void
}

function applyLogoRole(
  logos: StudioBrandLogo[],
  logoIndex: number,
  newRole: StudioBrandLogoRole,
): StudioBrandLogo[] {
  if (newRole === 'primary') {
    return logos.map((l, j) => {
      if (j === logoIndex) return { ...l, role: 'primary' }
      if (l.role === 'primary') return { ...l, role: 'wordmark' }
      return l
    })
  }
  return logos.map((l, j) => (j === logoIndex ? { ...l, role: newRole } : l))
}

export function StudioBrandLogosEditor({ logos, onChange }: StudioBrandLogosEditorProps) {
  const { t } = useTranslation()

  const roleSelectOptions = STUDIO_BRAND_LOGO_ROLES.map((role) => ({
    value: role,
    label: t(`studioSettings.general.brandLogoRole.${role}`),
  }))

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">{t('studioSettings.general.brandLogosHint')}</p>

      {logos.length === 0 ? (
        <p className="text-sm text-muted">{t('studioSettings.brandKit.logosEmpty')}</p>
      ) : (
        <ul className="space-y-3">
          {logos.map((logo, logoIndex) => (
            <li key={logo.id} className={cn(studioTintPanel, 'flex items-center gap-3')}>
              <ImageUpload
                value={logo.imageDataUrl}
                onChange={(imageDataUrl) => {
                  if (imageDataUrl === null) void removeStudioProfileImageUrl(logo.imageDataUrl)
                  onChange(logos.map((l, j) => (j === logoIndex ? { ...l, imageDataUrl } : l)))
                }}
                aspect="4:3"
                cap="logoMini"
                fit="contain"
                accept="image/*,image/svg+xml,.svg"
                placeholder={t('studioSettings.general.brandLogoUploadPlaceholder')}
                onUpload={async (file) => pickStudioProfileImageUrl(file, t, logo.imageDataUrl)}
              />
              <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-center">
                <Select
                  value={logo.role}
                  onChange={(v) => onChange(applyLogoRole(logos, logoIndex, v as StudioBrandLogoRole))}
                  options={roleSelectOptions}
                  placeholder={t('studioSettings.general.brandLogoRoleLabel')}
                />
                <Input
                  value={logo.label}
                  onChange={(e) =>
                    onChange(logos.map((l, j) => (j === logoIndex ? { ...l, label: e.target.value } : l)))
                  }
                  placeholder={t('studioSettings.general.brandLogoNotePlaceholder')}
                  aria-label={t('studioSettings.general.brandLogoNoteLabel')}
                />
              </div>
              <IconButton
                type="button"
                variant="destructive"
                size="sm"
                icon={Trash2}
                label={t('studioSettings.general.removeBrandLogo')}
                className="shrink-0"
                onClick={() => onChange(logos.filter((_, j) => j !== logoIndex))}
              />
            </li>
          ))}
        </ul>
      )}

      <StudioListAddButton
        type="button"
        onClick={() =>
          onChange([
            ...logos,
            {
              id: studioBrandKitNewId(),
              label: '',
              role: logos.length === 0 ? 'primary' : 'other',
              imageDataUrl: null,
            },
          ])
        }
      >
        {t('studioSettings.general.addBrandLogo')}
      </StudioListAddButton>
    </div>
  )
}
