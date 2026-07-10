'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/atoms'
import {
  studioBlockStack,
  studioEditorFieldsRow,
  studioEditorPanelBody,
} from '@/features/studio-settings/studioBlockChrome'
import {
  StudioDualImageUpload,
  StudioFieldHeader,
  StudioMinimalCollapsibleSection,
  StudioRichTextField,
} from '@/features/studio-settings/components'
import { STUDIO_WORK_TEXT_LIMITS } from '@/features/studio-settings/constants'
import {
  appendMissingReviewCatalogFromWorks,
  catalogIdSetsEqual,
  linkedWorksCatalogSignature,
} from '@/features/studio-settings/lib/studioReviewCatalogFromWorks'
import { isKeyOpen, sectionOpenMap } from '@/features/studio-settings/lib/studioSectionCollapse'
import { useStudioProfileStore } from '@/stores/studioProfileStore'

const REVIEW_SECTION_KEYS = ['media', 'identity', 'quote'] as const
type ReviewSectionKey = (typeof REVIEW_SECTION_KEYS)[number]

export function StudioReviewEditorForm({ reviewId }: { reviewId: string }) {
  const { t } = useTranslation()
  const works = useStudioProfileStore((s) => s.works)
  const serviceCatalog = useStudioProfileStore((s) => s.serviceCatalog)
  const reviews = useStudioProfileStore((s) => s.reviews)
  const updateReview = useStudioProfileStore((s) => s.updateReview)

  const row = useMemo(() => reviews.find((r) => r.id === reviewId), [reviews, reviewId])

  const [sectionsOpen, setSectionsOpen] = useState<Record<ReviewSectionKey, boolean>>(() =>
    sectionOpenMap(REVIEW_SECTION_KEYS, true),
  )

  const toggleSection = (key: ReviewSectionKey) => {
    setSectionsOpen((prev) => ({ ...prev, [key]: !isKeyOpen(prev, key) }))
  }

  const maxCatalog = STUDIO_WORK_TEXT_LIMITS.maxLinkedCatalogIds

  const worksCatalogSignature = useMemo(
    () =>
      row ? linkedWorksCatalogSignature(row.linkedWorkIds, works, serviceCatalog) : '',
    [row, works, serviceCatalog],
  )

  useEffect(() => {
    if (!row || row.linkedWorkIds.length === 0) return
    const next = appendMissingReviewCatalogFromWorks(
      row.linkedCatalogIds,
      row.linkedWorkIds,
      works,
      serviceCatalog,
      maxCatalog,
    )
    if (catalogIdSetsEqual(next, row.linkedCatalogIds)) return
    updateReview(reviewId, { linkedCatalogIds: next })
  }, [reviewId, worksCatalogSignature, maxCatalog, updateReview, works, serviceCatalog, row])

  if (!row) return null

  const id = reviewId

  return (
    <div className={studioEditorPanelBody}>
      <StudioMinimalCollapsibleSection
        title={t('studioSettings.reviews.collapsibleMediaTitle')}
        open={isKeyOpen(sectionsOpen, 'media')}
        onToggle={() => toggleSection('media')}
      >
        <div className="studio-field-stack">
          <StudioFieldHeader label={t('studioSettings.reviews.reviewMediaLabel')} showAi={false} />
          <StudioDualImageUpload
            horizontalValue={row.portraitDataUrl}
            portraitValue={row.portraitPortraitDataUrl}
            onHorizontalChange={(v) => updateReview(id, { portraitDataUrl: v })}
            onPortraitChange={(v) => updateReview(id, { portraitPortraitDataUrl: v })}
            horizontalPlaceholder={t('studioSettings.reviews.mediaHorizontalPlaceholder')}
            portraitPlaceholder={t('studioSettings.reviews.mediaPortraitPlaceholder')}
          />
        </div>
      </StudioMinimalCollapsibleSection>

      <StudioMinimalCollapsibleSection
        title={t('studioSettings.reviews.collapsibleIdentityTitle')}
        open={isKeyOpen(sectionsOpen, 'identity')}
        onToggle={() => toggleSection('identity')}
      >
        <div className={studioBlockStack}>
          <div className={studioEditorFieldsRow}>
            <div className="studio-field-stack">
              <StudioFieldHeader htmlFor={`rv-a-${id}`} label={t('studioSettings.reviews.author')} showAi={false} />
              <Input id={`rv-a-${id}`} value={row.author} onChange={(e) => updateReview(id, { author: e.target.value })} />
            </div>
            <div className="studio-field-stack">
              <StudioFieldHeader htmlFor={`rv-role-${id}`} label={t('studioSettings.reviews.role')} showAi={false} />
              <Input id={`rv-role-${id}`} value={row.role} onChange={(e) => updateReview(id, { role: e.target.value })} />
            </div>
            <div className="studio-field-stack">
              <StudioFieldHeader htmlFor={`rv-co-${id}`} label={t('studioSettings.reviews.company')} showAi={false} />
              <Input id={`rv-co-${id}`} value={row.company} onChange={(e) => updateReview(id, { company: e.target.value })} />
            </div>
          </div>
          <div className={studioEditorFieldsRow}>
            <div className="studio-field-stack">
              <StudioFieldHeader
                htmlFor={`rv-sh-${id}`}
                label={t('studioSettings.optionalFieldLabel', { field: t('studioSettings.general.subheader') })}
                showAi={false}
              />
              <Input
                id={`rv-sh-${id}`}
                value={row.subheader ?? ''}
                onChange={(e) => updateReview(id, { subheader: e.target.value })}
                placeholder={t('studioSettings.general.subheaderPlaceholder')}
              />
            </div>
            <div className="studio-field-stack">
              <StudioFieldHeader
                htmlFor={`rv-hl-${id}`}
                label={t('studioSettings.optionalFieldLabel', { field: t('studioSettings.general.headline') })}
                showAi={false}
              />
              <Input
                id={`rv-hl-${id}`}
                value={row.headline ?? ''}
                onChange={(e) => updateReview(id, { headline: e.target.value })}
                placeholder={t('studioSettings.general.headlinePlaceholder')}
              />
            </div>
            <div className="studio-field-stack">
              <StudioFieldHeader
                htmlFor={`rv-st-${id}`}
                label={t('studioSettings.optionalFieldLabel', { field: t('studioSettings.general.subtitle') })}
                showAi={false}
              />
              <Input
                id={`rv-st-${id}`}
                value={row.subtitle ?? ''}
                onChange={(e) => updateReview(id, { subtitle: e.target.value })}
                placeholder={t('studioSettings.general.subtitlePlaceholder')}
              />
            </div>
          </div>
        </div>
      </StudioMinimalCollapsibleSection>

      <StudioMinimalCollapsibleSection
        title={t('studioSettings.reviews.collapsibleQuoteTitle')}
        open={isKeyOpen(sectionsOpen, 'quote')}
        onToggle={() => toggleSection('quote')}
      >
        <div className={studioBlockStack}>
          <div className="studio-field-stack">
            <StudioFieldHeader htmlFor={`rv-short-${id}`} label={t('studioSettings.reviews.bodyShort')} showAi={false} />
            <StudioRichTextField
              id={`rv-short-${id}`}
              value={row.bodyShort}
              onChange={(html) => updateReview(id, { bodyShort: html })}
              placeholder={t('studioSettings.richText.reviewBodyShortPlaceholder')}
              minHeightClass="min-h-[4.5rem]"
            />
          </div>
          <div className="studio-field-stack">
            <StudioFieldHeader htmlFor={`rv-big-${id}`} label={t('studioSettings.reviews.bodyBig')} showAi={false} />
            <StudioRichTextField
              id={`rv-big-${id}`}
              value={row.bodyBig}
              onChange={(html) => updateReview(id, { bodyBig: html })}
              placeholder={t('studioSettings.richText.reviewBodyBigPlaceholder')}
              minHeightClass="min-h-[8rem]"
            />
          </div>
          <div className={studioEditorFieldsRow}>
            <div className="studio-field-stack sm:max-w-[8rem]">
              <StudioFieldHeader htmlFor={`rv-rate-${id}`} label={t('studioSettings.reviews.rating')} showAi={false} />
              <Input
                id={`rv-rate-${id}`}
                type="number"
                min={1}
                max={5}
                inputMode="numeric"
                value={row.rating === null ? '' : String(row.rating)}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === '') {
                    updateReview(id, { rating: null })
                    return
                  }
                  const n = Number(v)
                  if (Number.isFinite(n) && n >= 1 && n <= 5) updateReview(id, { rating: n })
                }}
              />
            </div>
            <div className="studio-field-stack flex-1">
              <StudioFieldHeader
                htmlFor={`rv-url-${id}`}
                label={t('studioSettings.reviews.urlLabel')}
                showAi={false}
              />
              <Input
                id={`rv-url-${id}`}
                type="url"
                inputMode="url"
                autoComplete="off"
                value={row.externalUrl}
                onChange={(e) => updateReview(id, { externalUrl: e.target.value })}
                placeholder={t('studioSettings.reviews.urlPlaceholder')}
              />
            </div>
          </div>
        </div>
      </StudioMinimalCollapsibleSection>
    </div>
  )
}
