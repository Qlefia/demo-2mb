'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Chip } from '@/components/atoms'
import { Select } from '@/components/molecules/Select'
import { StudioFieldHeader } from '@/features/studio-settings/components/StudioFieldHeader'
import {
  reviewRelationLabel,
  reviewsLinkingCatalogLine,
  serviceGroupsContainingCatalogLine,
} from '@/features/studio-settings/lib/catalogLineRelations'
import { STUDIO_WORK_TEXT_LIMITS } from '@/features/studio-settings/constants'
import { studioWorkspaceBody } from '@/features/studio-settings/studioBlockChrome'
import {
  studioGroupEditorPath,
  studioReviewEditorPath,
} from '@/lib/studio/studioSalesPaths'
import { getStudioServiceGroupTitle, useStudioProfileStore } from '@/stores/studioProfileStore'

type RelationSection = 'groups' | 'reviews'

type StudioCatalogLineRelationsFieldsProps = {
  catalogLineId: string
  sections?: RelationSection[]
  /** Sidebar rail: chips + add dropdown only. */
  compact?: boolean
}

export function StudioCatalogLineRelationsFields({
  catalogLineId,
  sections = ['groups', 'reviews'],
  compact = false,
}: StudioCatalogLineRelationsFieldsProps) {
  const { t } = useTranslation()
  const pathname = usePathname()
  const serviceGroups = useStudioProfileStore((s) => s.serviceGroups)
  const reviews = useStudioProfileStore((s) => s.reviews)
  const appendServiceGroupMember = useStudioProfileStore((s) => s.appendServiceGroupMember)
  const toggleServiceGroupMember = useStudioProfileStore((s) => s.toggleServiceGroupMember)
  const updateReview = useStudioProfileStore((s) => s.updateReview)

  const untitledGroup = t('studioSettings.services.untitledGroup')
  const untitledReview = t('studioSettings.reviews.listRowUntitled')

  const linkedGroups = useMemo(
    () => serviceGroupsContainingCatalogLine(catalogLineId, serviceGroups),
    [catalogLineId, serviceGroups],
  )

  const linkedReviews = useMemo(
    () => reviewsLinkingCatalogLine(catalogLineId, reviews),
    [catalogLineId, reviews],
  )

  const addableGroups = useMemo(
    () => serviceGroups.filter((g) => !g.memberIds.includes(catalogLineId)),
    [catalogLineId, serviceGroups],
  )

  const addableReviews = useMemo(
    () =>
      reviews.filter(
        (r) =>
          !r.linkedCatalogIds.includes(catalogLineId) &&
          r.linkedCatalogIds.length < STUDIO_WORK_TEXT_LIMITS.maxLinkedCatalogIds,
      ),
    [catalogLineId, reviews],
  )

  const showGroups = sections.includes('groups')
  const showReviews = sections.includes('reviews')

  return (
    <div className={compact ? 'space-y-2' : studioWorkspaceBody}>
      {showGroups ? (
        <div className="studio-field-stack">
          {!compact ? (
            <StudioFieldHeader label={t('studioSettings.services.catalogLineLinkedGroupsLabel')} showAi={false} />
          ) : null}
          {linkedGroups.length === 0 && !compact ? (
            <p className="text-sm text-muted">{t('studioSettings.services.catalogLineLinkedGroupsEmpty')}</p>
          ) : linkedGroups.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {linkedGroups.map((g) => {
                const label = getStudioServiceGroupTitle(serviceGroups, g.id, untitledGroup)
                return (
                  <li key={g.id}>
                    <Chip
                      onRemove={() => toggleServiceGroupMember(g.id, catalogLineId)}
                      className="max-w-full"
                    >
                      <Link
                        href={studioGroupEditorPath(pathname, g.id)}
                        className="min-w-0 truncate outline-none hover:underline focus-visible:underline"
                      >
                        {compact ? label : t('studioSettings.services.catalogLineLinkedGroupChip', { name: label })}
                      </Link>
                    </Chip>
                  </li>
                )
              })}
            </ul>
          ) : null}
          <Select
            value=""
            disabled={serviceGroups.length === 0 || addableGroups.length === 0}
            onChange={(gid) => {
              if (!gid) return
              appendServiceGroupMember(gid, catalogLineId)
            }}
            options={[
              { value: '', label: t('studioSettings.services.catalogLineAddToGroupPlaceholder') },
              ...addableGroups.map((g) => ({
                value: g.id,
                label: getStudioServiceGroupTitle(serviceGroups, g.id, untitledGroup),
              })),
            ]}
            placeholder={t('studioSettings.services.catalogLineAddToGroupPlaceholder')}
          />
        </div>
      ) : null}

      {showReviews ? (
        <div className="studio-field-stack">
          {!compact ? (
            <StudioFieldHeader label={t('studioSettings.services.catalogLineLinkedReviewsLabel')} showAi={false} />
          ) : null}
          {linkedReviews.length === 0 && !compact ? (
            <p className="text-sm text-muted">{t('studioSettings.services.catalogLineLinkedReviewsEmpty')}</p>
          ) : linkedReviews.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {linkedReviews.map((r) => {
                const label = reviewRelationLabel(r, untitledReview)
                return (
                  <li key={r.id}>
                    <Chip
                      onRemove={() =>
                        updateReview(r.id, {
                          linkedCatalogIds: r.linkedCatalogIds.filter((cid) => cid !== catalogLineId),
                        })
                      }
                      className="max-w-full"
                    >
                      <Link
                        href={studioReviewEditorPath(pathname, r.id)}
                        className="min-w-0 truncate outline-none hover:underline focus-visible:underline"
                      >
                        {label}
                      </Link>
                    </Chip>
                  </li>
                )
              })}
            </ul>
          ) : null}
          <Select
            value=""
            disabled={reviews.length === 0 || addableReviews.length === 0}
            onChange={(rid) => {
              if (!rid) return
              const row = reviews.find((x) => x.id === rid)
              if (!row || row.linkedCatalogIds.includes(catalogLineId)) return
              if (row.linkedCatalogIds.length >= STUDIO_WORK_TEXT_LIMITS.maxLinkedCatalogIds) return
              updateReview(rid, { linkedCatalogIds: [catalogLineId, ...row.linkedCatalogIds] })
            }}
            options={[
              { value: '', label: t('studioSettings.services.catalogLineAddReviewPlaceholder') },
              ...addableReviews.map((r) => ({
                value: r.id,
                label: reviewRelationLabel(r, untitledReview),
              })),
            ]}
            placeholder={t('studioSettings.services.catalogLineAddReviewPlaceholder')}
          />
        </div>
      ) : null}
    </div>
  )
}
