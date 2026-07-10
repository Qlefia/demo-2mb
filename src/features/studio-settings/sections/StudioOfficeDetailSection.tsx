'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Input, Label, TextArea } from '@/components/atoms'
import { Select } from '@/components/molecules/Select'
import {
  StudioDualImageUpload,
  StudioFieldHeader,
  StudioSalesDetailHeader,
} from '@/features/studio-settings/components'
import {
  studioEditorPanelBody,
  studioFieldStack,
  studioGhostAction,
  studioRadiusBlock,
  studioSectionStack,
} from '@/features/studio-settings/studioBlockChrome'
import { cn } from '@/lib/cn'
import { useStudioProfileStore } from '@/stores/studioProfileStore'
import type { StudioOfficeKind } from '@/stores/studioProfileTypes'

const STUDIO_SETTINGS_GENERAL = '/settings/studio'

const StudioOfficeMapPicker = dynamic(
  () =>
    import('@/features/studio-settings/components/StudioOfficeMapPicker').then(
      (m) => m.StudioOfficeMapPicker,
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className={cn(
          'h-72 w-full animate-pulse bg-foreground/[0.04] dark:bg-white/[0.05]',
          studioRadiusBlock,
        )}
      />
    ),
  },
)

export function StudioOfficeDetailSection() {
  const { t } = useTranslation()
  const params = useParams<{ id: string }>()
  const officeId = params?.id ?? null

  const offices = useStudioProfileStore((s) => s.general.studioOffices)
  const updateOffice = useStudioProfileStore((s) => s.updateOffice)

  const office = useMemo(() => offices.find((o) => o.id === officeId), [offices, officeId])

  if (!officeId || !office) {
    return (
      <div className="space-y-2 p-4">
        <p className="text-sm text-muted">{t('studioSettings.general.offices.notFound')}</p>
        <Link href={STUDIO_SETTINGS_GENERAL} className={studioGhostAction}>
          {t('studioSettings.general.offices.backToList')}
        </Link>
      </div>
    )
  }

  const headerTitle =
    office.label.trim() ||
    office.city.trim() ||
    t('studioSettings.general.offices.untitled')

  const kindOptions: { value: StudioOfficeKind; label: string }[] = [
    { value: 'physical', label: t('studioSettings.general.offices.kindPhysical') },
    { value: 'virtual', label: t('studioSettings.general.offices.kindVirtual') },
    { value: 'legal_registered', label: t('studioSettings.general.offices.kindLegalRegistered') },
  ]

  const defaultMapQuery = [office.addressLine, office.postalCode, office.city]
    .map((p) => p.trim())
    .filter(Boolean)
    .join(', ')

  return (
    <div className={studioSectionStack}>
      <StudioSalesDetailHeader
        backHref={STUDIO_SETTINGS_GENERAL}
        backLabelKey="studioSettings.general.offices.backToList"
        title={headerTitle}
      />

      <div className={studioEditorPanelBody}>
        <div className={studioFieldStack}>
          <StudioFieldHeader
            htmlFor={`office-label-${office.id}`}
            label={t('studioSettings.general.offices.labelField')}
            showAi={false}
          />
          <Input
            id={`office-label-${office.id}`}
            value={office.label}
            onChange={(e) => updateOffice(office.id, { label: e.target.value })}
            placeholder={t('studioSettings.general.offices.labelPlaceholder')}
          />
        </div>

        <div className={studioFieldStack}>
          <StudioFieldHeader
            label={t('studioSettings.general.offices.photos.label')}
            hint={t('studioSettings.general.offices.photos.hint')}
            showAi={false}
          />
          <StudioDualImageUpload
            horizontalValue={office.coverImageDataUrl}
            portraitValue={office.secondaryImageDataUrl}
            onHorizontalChange={(v) => updateOffice(office.id, { coverImageDataUrl: v })}
            onPortraitChange={(v) => updateOffice(office.id, { secondaryImageDataUrl: v })}
            horizontalPlaceholder={t('studioSettings.general.offices.photos.coverPlaceholder')}
            portraitPlaceholder={t('studioSettings.general.offices.photos.secondaryPlaceholder')}
          />
        </div>

        <div className="grid gap-[var(--studio-stack-block-gap)] sm:grid-cols-2">
          <div className={studioFieldStack}>
            <Label htmlFor={`office-city-${office.id}`}>
              {t('studioSettings.general.offices.city')}
            </Label>
            <Input
              id={`office-city-${office.id}`}
              value={office.city}
              onChange={(e) => updateOffice(office.id, { city: e.target.value })}
              placeholder={t('studioSettings.general.offices.cityPlaceholder')}
            />
          </div>
          <div className={studioFieldStack}>
            <Label htmlFor={`office-postal-${office.id}`}>
              {t('studioSettings.general.offices.postalCode')}
            </Label>
            <Input
              id={`office-postal-${office.id}`}
              value={office.postalCode}
              onChange={(e) => updateOffice(office.id, { postalCode: e.target.value })}
              placeholder={t('studioSettings.general.offices.postalPlaceholder')}
            />
          </div>
          <div className={`${studioFieldStack} sm:col-span-2`}>
            <Label htmlFor={`office-address-${office.id}`}>
              {t('studioSettings.general.offices.addressField')}
            </Label>
            <Input
              id={`office-address-${office.id}`}
              value={office.addressLine}
              onChange={(e) => updateOffice(office.id, { addressLine: e.target.value })}
              placeholder={t('studioSettings.general.offices.addressPlaceholder')}
            />
          </div>
          <div className={`${studioFieldStack} sm:col-span-2`}>
            <Label>{t('studioSettings.general.offices.kind')}</Label>
            <Select
              value={office.kind}
              onChange={(v) => updateOffice(office.id, { kind: v as StudioOfficeKind })}
              options={kindOptions}
            />
          </div>
        </div>

        <div className={studioFieldStack}>
          <StudioFieldHeader
            label={t('studioSettings.general.offices.map.label')}
            hint={t('studioSettings.general.offices.map.hint')}
            showAi={false}
          />
          <StudioOfficeMapPicker
            latitude={office.latitude}
            longitude={office.longitude}
            defaultQuery={defaultMapQuery}
            onChange={({ latitude, longitude }) =>
              updateOffice(office.id, { latitude, longitude })
            }
            onClear={() => updateOffice(office.id, { latitude: null, longitude: null })}
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-muted">
            {t('studioSettings.general.offices.contactSection')}
          </p>
          <div className="grid gap-[var(--studio-stack-block-gap)] sm:grid-cols-2">
            <div className={studioFieldStack}>
              <Label htmlFor={`office-contact-name-${office.id}`}>
                {t('studioSettings.optionalFieldLabel', {
                  field: t('studioSettings.general.offices.contactName'),
                })}
              </Label>
              <Input
                id={`office-contact-name-${office.id}`}
                value={office.contactName}
                onChange={(e) => updateOffice(office.id, { contactName: e.target.value })}
                placeholder={t('studioSettings.general.offices.contactNamePlaceholder')}
              />
            </div>
            <div className={studioFieldStack}>
              <Label htmlFor={`office-contact-phone-${office.id}`}>
                {t('studioSettings.optionalFieldLabel', {
                  field: t('studioSettings.general.offices.contactPhone'),
                })}
              </Label>
              <Input
                id={`office-contact-phone-${office.id}`}
                type="tel"
                autoComplete="tel"
                value={office.contactPhone}
                onChange={(e) => updateOffice(office.id, { contactPhone: e.target.value })}
                placeholder={t('studioSettings.general.offices.contactPhonePlaceholder')}
              />
            </div>
            <div className={`${studioFieldStack} sm:col-span-2`}>
              <Label htmlFor={`office-contact-email-${office.id}`}>
                {t('studioSettings.optionalFieldLabel', {
                  field: t('studioSettings.general.offices.contactEmail'),
                })}
              </Label>
              <Input
                id={`office-contact-email-${office.id}`}
                type="email"
                autoComplete="email"
                value={office.contactEmail}
                onChange={(e) => updateOffice(office.id, { contactEmail: e.target.value })}
                placeholder={t('studioSettings.general.offices.contactEmailPlaceholder')}
              />
            </div>
          </div>
        </div>

        <div className={studioFieldStack}>
          <Label htmlFor={`office-notes-${office.id}`}>
            {t('studioSettings.optionalFieldLabel', {
              field: t('studioSettings.general.offices.notes'),
            })}
          </Label>
          <TextArea
            id={`office-notes-${office.id}`}
            rows={3}
            value={office.notes}
            onChange={(e) => updateOffice(office.id, { notes: e.target.value })}
            placeholder={t('studioSettings.general.offices.notesPlaceholder')}
          />
        </div>
      </div>
    </div>
  )
}
