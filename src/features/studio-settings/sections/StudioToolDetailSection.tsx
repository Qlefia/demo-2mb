'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useParams, usePathname } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/atoms'
import { Select } from '@/components/molecules/Select'
import { Switch } from '@/components/atoms'
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
import { STUDIO_TOOL_CATEGORIES } from '@/stores/studioProfileTypes'
import { studioToolsListPath } from '@/lib/studio/studioSalesPaths'

export function StudioToolDetailSection() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const params = useParams<{ toolId: string }>()
  const toolId = params.toolId
  const listHref = studioToolsListPath(pathname)

  const tools = useStudioProfileStore((s) => s.tools)
  const updateTool = useStudioProfileStore((s) => s.updateTool)
  const tool = useMemo(() => tools.find((x) => x.id === toolId), [tools, toolId])

  const categoryOptions = useMemo(
    () =>
      STUDIO_TOOL_CATEGORIES.map((c) => ({
        value: c,
        label: t(`studioSettings.tools.category.${c}`),
      })),
    [t],
  )

  if (!toolId || !tool) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted">{t('studioSettings.tools.notFound')}</p>
        <Link href={listHref} className={studioGhostAction}>
          {t('studioSettings.tools.backToList')}
        </Link>
      </div>
    )
  }

  const headerTitle = tool.name.trim() || t('studioSettings.tools.untitled')

  return (
    <StudioDetailWithRelationsSidebar entity={{ kind: 'tool', id: tool.id }}>
      <div className={studioSectionStack}>
        <StudioSalesDetailHeader
          backHref={listHref}
          backLabelKey="studioSettings.tools.backToList"
          title={headerTitle}
        />

        <div className={studioEditorPanelBody}>
          <div className="grid gap-[var(--studio-stack-block-gap)] sm:grid-cols-2">
            <div className="studio-field-stack">
              <StudioFieldHeader htmlFor="tool-name" label={t('studioSettings.tools.fields.name')} showAi={false} />
              <Input
                id="tool-name"
                value={tool.name}
                onChange={(e) => updateTool(tool.id, { name: e.target.value })}
                placeholder={t('studioSettings.tools.fields.namePlaceholder')}
              />
            </div>
            <div className="studio-field-stack">
              <StudioFieldHeader htmlFor="tool-vendor" label={t('studioSettings.tools.fields.vendor')} showAi={false} />
              <Input
                id="tool-vendor"
                value={tool.vendor}
                onChange={(e) => updateTool(tool.id, { vendor: e.target.value })}
                placeholder={t('studioSettings.tools.fields.vendorPlaceholder')}
              />
            </div>
          </div>

          <div className="grid gap-[var(--studio-stack-block-gap)] sm:grid-cols-2">
            <div className="studio-field-stack">
              <StudioFieldHeader htmlFor="tool-cat" label={t('studioSettings.tools.fields.category')} showAi={false} />
              <Select
                value={tool.category}
                onChange={(value) =>
                  updateTool(tool.id, { category: value as (typeof STUDIO_TOOL_CATEGORIES)[number] })
                }
                options={categoryOptions}
              />
            </div>
            <div className="studio-field-stack">
              <StudioFieldHeader htmlFor="tool-url" label={t('studioSettings.tools.fields.url')} showAi={false} />
              <Input
                id="tool-url"
                type="url"
                inputMode="url"
                autoComplete="off"
                value={tool.externalUrl}
                onChange={(e) => updateTool(tool.id, { externalUrl: e.target.value })}
                placeholder={t('studioSettings.tools.fields.urlPlaceholder')}
              />
            </div>
          </div>

          <div className="studio-field-stack">
            <StudioFieldHeader htmlFor="tool-sum" label={t('studioSettings.tools.fields.summary')} showAi={false} />
            <Input
              id="tool-sum"
              value={tool.summary}
              onChange={(e) => updateTool(tool.id, { summary: e.target.value })}
              placeholder={t('studioSettings.tools.fields.summaryPlaceholder')}
              maxLength={160}
            />
          </div>

          <div className="studio-field-stack">
            <StudioFieldHeader label={t('studioSettings.tools.fields.image')} showAi={false} />
            <StudioDualImageUpload
              horizontalValue={tool.iconDataUrl}
              portraitValue={tool.iconPortraitDataUrl}
              onHorizontalChange={(v) => updateTool(tool.id, { iconDataUrl: v })}
              onPortraitChange={(v) => updateTool(tool.id, { iconPortraitDataUrl: v })}
              horizontalPlaceholder={t('studioSettings.tools.fields.imagePlaceholder')}
              portraitPlaceholder={t('studioSettings.tools.fields.imagePortraitPlaceholder')}
            />
          </div>

          <div className="studio-field-stack">
            <StudioFieldHeader htmlFor="tool-desc" label={t('studioSettings.tools.fields.description')} showAi={false} />
            <StudioRichTextField
              id="tool-desc"
              value={tool.description}
              onChange={(html) => updateTool(tool.id, { description: html })}
              placeholder={t('studioSettings.tools.fields.descriptionPlaceholder')}
              minHeightClass="min-h-[8rem]"
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-[var(--form-field-radius)] border border-border/60 bg-background/40 px-3 py-2.5">
            <div>
              <p className="text-xs font-medium text-foreground">{t('studioSettings.tools.fields.featured')}</p>
              <p className="text-[11px] text-muted">{t('studioSettings.tools.fields.featuredHint')}</p>
            </div>
            <Switch
              checked={tool.featured}
              onChange={(checked) => updateTool(tool.id, { featured: checked })}
            />
          </div>
        </div>
      </div>
    </StudioDetailWithRelationsSidebar>
  )
}
