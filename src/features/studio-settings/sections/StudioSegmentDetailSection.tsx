'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useParams, usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/atoms'
import {
  StudioDetailWithRelationsSidebar,
  StudioDualImageUpload,
  StudioFieldHeader,
  StudioRichTextField,
  StudioSalesDetailHeader,
} from '@/features/studio-settings/components'
import {
  studioEditorPanelBody,
  studioGhostAction,
  studioSectionStack,
} from '@/features/studio-settings/studioBlockChrome'
import { useStudioProfileStore } from '@/stores/studioProfileStore'
import { studioSegmentsListPath } from '@/lib/studio/studioSalesPaths'

export function StudioSegmentDetailSection() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const params = useParams<{ segmentId: string }>()
  const segmentId = params.segmentId
  const listHref = studioSegmentsListPath(pathname)

  const segments = useStudioProfileStore((s) => s.segments)
  const updateSegment = useStudioProfileStore((s) => s.updateSegment)
  const row = useMemo(() => segments.find((s) => s.id === segmentId), [segments, segmentId])

  if (!segmentId || !row) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted">{t('studioSettings.segments.notFound')}</p>
        <Link href={listHref} className={studioGhostAction}>
          {t('studioSettings.backToSegments')}
        </Link>
      </div>
    )
  }

  const headerTitle = row.title.trim() || row.headline.trim() || t('studioSettings.segments.untitled')

  return (
    <StudioDetailWithRelationsSidebar entity={{ kind: 'segment', id: row.id }}>
      <div className={studioSectionStack}>
        <StudioSalesDetailHeader
          backHref={listHref}
          backLabelKey="studioSettings.backToSegments"
          title={headerTitle}
        />

        <div className={studioEditorPanelBody}>
          <div className="studio-field-stack">
            <StudioFieldHeader htmlFor="seg-title" label={t('studioSettings.segments.title')} showAi={false} />
            <Input
              id="seg-title"
              value={row.title}
              onChange={(e) => updateSegment(row.id, { title: e.target.value })}
              placeholder={t('studioSettings.segments.titlePlaceholder')}
            />
          </div>

          <div className="studio-field-stack">
            <StudioFieldHeader label={t('studioSettings.segments.banner')} showAi={false} />
            <StudioDualImageUpload
              horizontalValue={row.bannerDataUrl}
              portraitValue={row.bannerPortraitDataUrl ?? null}
              onHorizontalChange={(v) => updateSegment(row.id, { bannerDataUrl: v })}
              onPortraitChange={(v) => updateSegment(row.id, { bannerPortraitDataUrl: v })}
              horizontalPlaceholder={t('studioSettings.general.bannerImagePlaceholder')}
              portraitPlaceholder={t('studioSettings.general.bannerPortraitPlaceholder')}
            />
          </div>

          <div className="grid gap-[var(--studio-stack-block-gap)] sm:grid-cols-3">
            <div className="studio-field-stack">
              <StudioFieldHeader
                htmlFor="seg-subheader"
                label={t('studioSettings.optionalFieldLabel', { field: t('studioSettings.general.subheader') })}
                showAi={false}
              />
              <Input
                id="seg-subheader"
                value={row.subheader ?? ''}
                onChange={(e) => updateSegment(row.id, { subheader: e.target.value })}
                placeholder={t('studioSettings.general.subheaderPlaceholder')}
              />
            </div>
            <div className="studio-field-stack">
              <StudioFieldHeader
                htmlFor="seg-headline"
                label={t('studioSettings.optionalFieldLabel', { field: t('studioSettings.general.headline') })}
                showAi={false}
              />
              <Input
                id="seg-headline"
                value={row.headline ?? ''}
                onChange={(e) => updateSegment(row.id, { headline: e.target.value })}
                placeholder={t('studioSettings.general.headlinePlaceholder')}
              />
            </div>
            <div className="studio-field-stack">
              <StudioFieldHeader
                htmlFor="seg-subtitle"
                label={t('studioSettings.optionalFieldLabel', { field: t('studioSettings.general.subtitle') })}
                showAi={false}
              />
              <Input
                id="seg-subtitle"
                value={row.subtitle ?? ''}
                onChange={(e) => updateSegment(row.id, { subtitle: e.target.value })}
                placeholder={t('studioSettings.general.subtitlePlaceholder')}
              />
            </div>
          </div>

          <div className="studio-field-stack">
            <StudioFieldHeader htmlFor="seg-desc" label={t('studioSettings.segments.description')} showAi={false} />
            <StudioRichTextField
              id="seg-desc"
              value={row.description}
              onChange={(html) => updateSegment(row.id, { description: html })}
              placeholder={t('studioSettings.richText.segmentPlaceholder')}
              minHeightClass="min-h-[8rem]"
            />
          </div>

          <div className="studio-field-stack">
            <StudioFieldHeader htmlFor="seg-url" label={t('studioSettings.segments.urlLabel')} showAi={false} />
            <Input
              id="seg-url"
              type="url"
              inputMode="url"
              autoComplete="off"
              value={row.externalUrl}
              onChange={(e) => updateSegment(row.id, { externalUrl: e.target.value })}
              placeholder={t('studioSettings.segments.urlPlaceholder')}
            />
          </div>
        </div>
      </div>
    </StudioDetailWithRelationsSidebar>
  )
}
