'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { ListFilter } from 'lucide-react'
import { SearchInput, ViewModeToggle, Popover } from '@/components/molecules'
import { StudioAccentAddButton } from '@/features/studio-settings/components/StudioAccentAddButton'
import { useStudioTemplatesListUiStore } from '@/stores/studioTemplatesListUiStore'
import type { StudioTemplatesListFilter } from '@/stores/studioTemplatesListUiStore'
import { useStudioProfileStore } from '@/stores/studioProfileStore'
import { studioTemplateDetailPath } from '@/lib/studio/studioTemplatesPaths'
import { STUDIO_DOCUMENT_TEMPLATES_MAX } from '@/features/studio-settings/constants'
import type { StudioDocumentTemplateKind } from '@/stores/studioProfileTypes'

const FILTER_OPTIONS: StudioTemplatesListFilter[] = ['all', 'default', 'custom']

type StudioTemplatesListToolbarProps = {
  kind: StudioDocumentTemplateKind
}

export function StudioTemplatesListToolbar({ kind }: StudioTemplatesListToolbarProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const search = useStudioTemplatesListUiStore((s) => s.search)
  const viewMode = useStudioTemplatesListUiStore((s) => s.viewMode)
  const filter = useStudioTemplatesListUiStore((s) => s.filter)
  const setSearch = useStudioTemplatesListUiStore((s) => s.setSearch)
  const setViewMode = useStudioTemplatesListUiStore((s) => s.setViewMode)
  const setFilter = useStudioTemplatesListUiStore((s) => s.setFilter)
  const setLastKind = useStudioTemplatesListUiStore((s) => s.setLastKind)
  const resetFilters = useStudioTemplatesListUiStore((s) => s.resetFilters)
  const addDocumentTemplate = useStudioProfileStore((s) => s.addDocumentTemplate)
  const totalCount = useStudioProfileStore((s) => s.general.documentTemplates.length)

  const hasActiveFilter = filter !== 'all'
  const canAdd = totalCount < STUDIO_DOCUMENT_TEMPLATES_MAX

  const handleAdd = useCallback(() => {
    if (!canAdd) return
    setLastKind(kind)
    const id = addDocumentTemplate(kind)
    router.push(studioTemplateDetailPath(id))
  }, [addDocumentTemplate, canAdd, kind, router, setLastKind])

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder={t('studioSettings.templates.toolbar.searchPlaceholder')}
        className="w-full sm:w-[260px]"
      />
      <div className="flex min-w-0 shrink-0 flex-nowrap items-center gap-2 overflow-x-auto overscroll-x-contain">
        <StudioAccentAddButton type="button" onClick={handleAdd} disabled={!canAdd}>
          {t(`studioSettings.templates.${kind}.add`)}
        </StudioAccentAddButton>
        <Popover
          trigger={
            <div className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm border border-border">
              <ListFilter size={14} strokeWidth={1.5} className="text-muted" aria-hidden />
              {hasActiveFilter ? (
                <span
                  className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary"
                  aria-hidden
                />
              ) : null}
            </div>
          }
          className="min-w-52"
        >
          <div className="flex flex-col gap-3">
            <div className="crm-meta-label">
              {t('studioSettings.templates.toolbar.filterLabel')}
            </div>
            <div className="flex flex-col gap-2">
              {FILTER_OPTIONS.map((value) => (
                <label key={value} className="flex cursor-pointer items-center gap-2 text-xs">
                  <input
                    type="radio"
                    name="studioTemplatesFilter"
                    checked={filter === value}
                    onChange={() => setFilter(value)}
                    className="accent-primary"
                  />
                  {t(`studioSettings.templates.toolbar.filter.${value}`)}
                </label>
              ))}
            </div>
            {hasActiveFilter ? (
              <button
                type="button"
                onClick={resetFilters}
                className="text-left text-xs text-muted underline-offset-2 hover:text-foreground hover:underline"
              >
                {t('studioSettings.templates.toolbar.resetFilters')}
              </button>
            ) : null}
          </div>
        </Popover>
        <ViewModeToggle
          mode={viewMode}
          onChange={(mode) => {
            if (mode === 'list' || mode === 'card') setViewMode(mode)
          }}
          options={['list', 'card']}
        />
      </div>
    </div>
  )
}
