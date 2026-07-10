'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/atoms'
import { Select } from '@/components/molecules/Select'
import { studioWorkPortfolioCategoryOptions } from '@/features/studio-settings/lib/studioWorkPortfolioCategory'
import { useStudioProfileStore } from '@/stores/studioProfileStore'
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
import { studioWorksBasePath } from '@/lib/studio/studioSalesPaths'

export function StudioWorkDetailSection() {
  const { t } = useTranslation()
  const params = useParams<{ workId: string }>()
  const pathname = usePathname()
  const worksListPath = studioWorksBasePath(pathname)
  const workId = params.workId

  const works = useStudioProfileStore((s) => s.works)
  const updateWork = useStudioProfileStore((s) => s.updateWork)

  const work = useMemo(() => works.find((w) => w.id === workId), [works, workId])

  if (!workId || !work) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted">{t('studioSettings.works.notFound')}</p>
        <Link href={worksListPath} className={studioGhostAction}>
          {t('studioSettings.backToWorks')}
        </Link>
      </div>
    )
  }

  const headerTitle = work.title.trim() || t('studioSettings.works.untitled')
  const urlPh = t('studioSettings.works.fields.urlPlaceholder')
  const categoryOptions = studioWorkPortfolioCategoryOptions(t, work.categoryLabel)

  return (
    <StudioDetailWithRelationsSidebar entity={{ kind: 'work', id: work.id }}>
      <div className={studioSectionStack}>
        <StudioSalesDetailHeader
          backHref={worksListPath}
          backLabelKey="studioSettings.backToWorks"
          title={headerTitle}
        />

        <div className={studioEditorPanelBody}>
          <div className="studio-field-stack">
            <StudioFieldHeader htmlFor="w-title" label={t('studioSettings.works.fields.title')} showAi={false} />
            <Input
              id="w-title"
              value={work.title}
              onChange={(e) => updateWork(work.id, { title: e.target.value })}
            />
          </div>

          <div className="studio-field-stack">
            <StudioFieldHeader label={t('studioSettings.works.workMediaLabel')} showAi={false} />
            <StudioDualImageUpload
              horizontalValue={work.bannerDataUrl}
              portraitValue={work.bannerPortraitDataUrl}
              onHorizontalChange={(v) => updateWork(work.id, { bannerDataUrl: v })}
              onPortraitChange={(v) => updateWork(work.id, { bannerPortraitDataUrl: v })}
              horizontalPlaceholder={t('studioSettings.works.fields.bannerPlaceholder')}
              portraitPlaceholder={t('studioSettings.works.fields.bannerPortraitPlaceholder')}
            />
          </div>

          <div className="studio-field-stack">
            <StudioFieldHeader
              htmlFor="w-category"
              label={t('studioSettings.works.fields.category')}
              showAi={false}
            />
            <Select
              value={work.categoryLabel}
              onChange={(value) => updateWork(work.id, { categoryLabel: value })}
              options={categoryOptions}
              placeholder={t('studioSettings.works.portfolioCategory.placeholder')}
            />
            <p className="text-xs text-muted">{t('studioSettings.works.fields.categoryHint')}</p>
          </div>

          <div className="studio-field-stack">
            <StudioFieldHeader
              htmlFor="w-desc"
              label={t('studioSettings.works.fields.description')}
              showAi={false}
            />
            <StudioRichTextField
              id="w-desc"
              value={work.description}
              onChange={(html) => updateWork(work.id, { description: html })}
              placeholder={t('studioSettings.richText.workDescriptionPlaceholder')}
              minHeightClass="min-h-[8rem]"
            />
          </div>

          <div className="studio-field-stack">
            <StudioFieldHeader htmlFor="w-case" label={t('studioSettings.works.fields.caseUrl')} showAi={false} />
            <Input
              id="w-case"
              type="url"
              inputMode="url"
              autoComplete="off"
              value={work.caseUrl}
              onChange={(e) => updateWork(work.id, { caseUrl: e.target.value })}
              placeholder={urlPh}
            />
          </div>
        </div>
      </div>
    </StudioDetailWithRelationsSidebar>
  )
}
