'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/atoms'
import {
  StudioDetailWithRelationsSidebar,
  StudioCatalogLinePricingFields,
  StudioFieldHeader,
  StudioRichTextField,
  StudioSalesDetailHeader,
} from '@/features/studio-settings/components'
import { StudioCatalogLineMediaFields } from '@/features/studio-settings/components/StudioCatalogLineMediaFields'
import { catalogLinePatchForTitleChange } from '@/features/studio-settings/lib/catalogLineTitlePatch'
import { STUDIO_SERVICE_CATALOG_LIMITS } from '@/features/studio-settings/constants'
import {
  studioEditorPanelBody,
  studioGhostAction,
  studioSectionStack,
} from '@/features/studio-settings/studioBlockChrome'
import { useStudioProfileStore } from '@/stores/studioProfileStore'
import { studioServicesCatalogPath } from '@/lib/studio/studioSalesPaths'

export function StudioServiceCatalogEditorSection() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const params = useParams<{ catalogId: string }>()
  const catalogId = params.catalogId
  const listHref = studioServicesCatalogPath(pathname)

  const serviceCatalog = useStudioProfileStore((s) => s.serviceCatalog)
  const updateCatalogItem = useStudioProfileStore((s) => s.updateCatalogItem)

  const row = useMemo(() => serviceCatalog.find((c) => c.id === catalogId), [serviceCatalog, catalogId])

  const headerTitle = row?.title.trim() || t('studioSettings.services.unnamedLine')

  if (!catalogId || !row) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted">{t('studioSettings.services.catalogLineNotFound')}</p>
        <Link href={listHref} className={studioGhostAction}>
          {t('studioSettings.backToServices')}
        </Link>
      </div>
    )
  }

  const id = row.id
  const patch = (p: Parameters<typeof updateCatalogItem>[1]) => updateCatalogItem(id, p)

  return (
    <StudioDetailWithRelationsSidebar entity={{ kind: 'catalog', id }}>
      <div className={studioSectionStack}>
        <StudioSalesDetailHeader backHref={listHref} backLabelKey="studioSettings.backToServices" title={headerTitle} />

        <div className={studioEditorPanelBody}>
          <div className="studio-field-stack">
            <StudioFieldHeader htmlFor="cat-title" label={t('studioSettings.services.lineTitle')} showAi={false} />
            <Input
              id="cat-title"
              value={row.title}
              onChange={(e) => patch(catalogLinePatchForTitleChange(row.title, e.target.value))}
              maxLength={STUDIO_SERVICE_CATALOG_LIMITS.title}
            />
          </div>

          <StudioCatalogLineMediaFields row={row} onPatch={patch} />

          <div className="studio-field-stack">
            <StudioFieldHeader
              htmlFor="cat-desc"
              label={t('studioSettings.services.lineDescription')}
              hint={t('studioSettings.services.lineDescriptionHint')}
              showAi={false}
            />
            <StudioRichTextField
              id="cat-desc"
              value={row.description}
              onChange={(html) => patch({ description: html })}
              placeholder={t('studioSettings.richText.serviceLinePlaceholder')}
              minHeightClass="min-h-[8rem]"
            />
          </div>

          <div className="studio-field-stack">
            <StudioFieldHeader
              label={t('studioSettings.services.pricingSectionTitle')}
              hint={t('studioSettings.services.pricingSectionHint')}
              showAi={false}
            />
            <StudioCatalogLinePricingFields row={row} onPatch={patch} idPrefix="cat-pricing" />
          </div>

          <div className="grid gap-[var(--studio-stack-block-gap)] sm:grid-cols-2">
            <div className="studio-field-stack">
              <StudioFieldHeader htmlFor="cat-code" label={t('studioSettings.services.lineCode')} showAi={false} />
              <Input
                id="cat-code"
                value={row.code}
                onChange={(e) => patch({ code: e.target.value })}
                maxLength={STUDIO_SERVICE_CATALOG_LIMITS.code}
                placeholder={t('studioSettings.services.lineCodePlaceholder')}
              />
            </div>
            <div className="studio-field-stack">
              <StudioFieldHeader
                htmlFor="cat-url"
                label={t('studioSettings.services.lineExternalUrl')}
                showAi={false}
              />
              <Input
                id="cat-url"
                type="url"
                inputMode="url"
                autoComplete="off"
                value={row.externalUrl}
                onChange={(e) => patch({ externalUrl: e.target.value })}
                maxLength={STUDIO_SERVICE_CATALOG_LIMITS.externalUrl}
                placeholder={t('studioSettings.services.lineExternalUrlPlaceholder')}
              />
            </div>
          </div>
        </div>
      </div>
    </StudioDetailWithRelationsSidebar>
  )
}





