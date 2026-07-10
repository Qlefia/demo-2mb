'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/atoms'
import {
  studioEditorPanelBody,
  studioGhostAction,
  studioSectionStack,
} from '@/features/studio-settings/studioBlockChrome'
import {
  StudioDetailWithRelationsSidebar,
  StudioDualImageUpload,
  StudioFieldHeader,
  StudioRichTextField,
  StudioSalesDetailHeader,
} from '@/features/studio-settings/components'
import { useStudioProfileStore } from '@/stores/studioProfileStore'
import { studioSalesGroupsListPath } from '@/lib/studio/studioSalesPaths'

export function StudioServiceGroupEditorSection() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const params = useParams<{ groupId: string | string[] | undefined }>()
  const rawGroupId = params.groupId
  const groupId =
    typeof rawGroupId === 'string'
      ? rawGroupId
      : Array.isArray(rawGroupId)
        ? (rawGroupId[0] ?? '')
        : ''
  const groupsListHref = studioSalesGroupsListPath(pathname)

  const serviceGroups = useStudioProfileStore((s) => s.serviceGroups)
  const updateServiceGroup = useStudioProfileStore((s) => s.updateServiceGroup)
  const group = useMemo(() => serviceGroups.find((g) => g.id === groupId), [serviceGroups, groupId])

  if (!groupId || !group) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted">{t('studioSettings.services.groupNotFound')}</p>
        <Link href={groupsListHref} className={studioGhostAction}>
          {t('studioSettings.backToGroups')}
        </Link>
      </div>
    )
  }

  const headerTitle = group.title.trim() || t('studioSettings.services.untitledGroup')

  return (
    <StudioDetailWithRelationsSidebar entity={{ kind: 'group', id: group.id }}>
      <div className={studioSectionStack}>
        <StudioSalesDetailHeader
          backHref={groupsListHref}
          backLabelKey="studioSettings.backToGroups"
          title={headerTitle}
        />

        <div className={studioEditorPanelBody}>
          <div className="studio-field-stack">
            <StudioFieldHeader htmlFor="grp-title" label={t('studioSettings.services.groupName')} showAi={false} />
            <Input
              id="grp-title"
              value={group.title}
              onChange={(e) => updateServiceGroup(group.id, { title: e.target.value })}
              placeholder={t('studioSettings.services.groupNamePlaceholder')}
            />
          </div>
          <div className="studio-field-stack">
            <StudioFieldHeader label={t('studioSettings.services.groupBannerLabel')} showAi={false} />
            <StudioDualImageUpload
              horizontalValue={group.bannerDataUrl}
              portraitValue={group.bannerPortraitDataUrl}
              onHorizontalChange={(v) => updateServiceGroup(group.id, { bannerDataUrl: v })}
              onPortraitChange={(v) => updateServiceGroup(group.id, { bannerPortraitDataUrl: v })}
              horizontalPlaceholder={t('studioSettings.services.groupBannerPlaceholder')}
              portraitPlaceholder={t('studioSettings.services.groupBannerPortraitPlaceholder')}
            />
          </div>
          <div className="studio-field-stack">
            <StudioFieldHeader
              htmlFor="grp-pkg-desc"
              label={t('studioSettings.services.groupPackageDescription')}
              hint={t('studioSettings.services.groupPackageDescriptionHint')}
              showAi={false}
            />
            <StudioRichTextField
              id="grp-pkg-desc"
              value={group.description}
              onChange={(html) => updateServiceGroup(group.id, { description: html })}
              placeholder={t('studioSettings.richText.groupPackagePlaceholder')}
              minHeightClass="min-h-[8rem]"
            />
          </div>
          <div className="studio-field-stack">
            <StudioFieldHeader
              htmlFor="grp-url"
              label={t('studioSettings.services.groupUrlLabel')}
              showAi={false}
            />
            <Input
              id="grp-url"
              type="url"
              inputMode="url"
              autoComplete="off"
              value={group.externalUrl}
              onChange={(e) => updateServiceGroup(group.id, { externalUrl: e.target.value })}
              placeholder={t('studioSettings.services.groupUrlPlaceholder')}
            />
          </div>
        </div>
      </div>
    </StudioDetailWithRelationsSidebar>
  )
}
