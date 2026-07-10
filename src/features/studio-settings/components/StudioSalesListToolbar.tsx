'use client'

import { useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { SearchInput } from '@/components/molecules'
import { ViewModeToggle, toast } from '@/components/molecules'
import { StudioAccentAddButton } from '@/features/studio-settings/components/StudioAccentAddButton'
import { StudioSalesListFilters } from '@/features/studio-settings/components/StudioSalesListFilters'
import { StudioSalesListSort } from '@/features/studio-settings/components/StudioSalesListSort'
import { createPlaybook } from '@/features/playbooks/lib/playbooksApi'
import { playbooksListQueryKey } from '@/features/playbooks/lib/playbookQueryKeys'
import type { StudioSalesListTab, StudioSalesListViewMode } from '@/features/studio-settings/lib/studioSalesListTypes'
import {
  studioCatalogEditorPath,
  studioGroupEditorPath,
  studioPlaybookEditorPath,
  studioProductEditorPath,
  studioReviewEditorPath,
  studioSegmentEditorPath,
  studioToolEditorPath,
  studioWorksBasePath,
} from '@/lib/studio/studioSalesPaths'
import { useStudioProfileStore } from '@/stores/studioProfileStore'
import { useStudioSalesListUiStore } from '@/stores/studioSalesListUiStore'

type StudioSalesListToolbarProps = {
  tab: StudioSalesListTab
  resultCount?: number
}

const VIEW_OPTIONS: Record<StudioSalesListTab, StudioSalesListViewMode[]> = {
  groups: ['list', 'card'],
  services: ['list', 'card'],
  works: ['list', 'card', 'kanban'],
  reviews: ['list', 'card'],
  segments: ['list', 'card'],
  tools: ['list', 'card'],
  products: ['list', 'card'],
  playbooks: ['list', 'card'],
}

const ADD_LABEL_KEYS: Record<StudioSalesListTab, string> = {
  groups: 'studioSettings.services.addGroup',
  services: 'studioSettings.services.addLine',
  works: 'studioSettings.works.add',
  reviews: 'studioSettings.reviews.add',
  segments: 'studioSettings.segments.add',
  tools: 'studioSettings.tools.add',
  products: 'studioSettings.products.add',
  playbooks: 'studioSettings.playbooks.add',
}

export function StudioSalesListToolbar({ tab, resultCount }: StudioSalesListToolbarProps) {
  const { t } = useTranslation()
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const search = useStudioSalesListUiStore((s) => s[tab].search)
  const viewMode = useStudioSalesListUiStore((s) => s[tab].viewMode)
  const setSearch = useStudioSalesListUiStore((s) => s.setSearch)
  const setViewMode = useStudioSalesListUiStore((s) => s.setViewMode)
  const addServiceGroup = useStudioProfileStore((s) => s.addServiceGroup)
  const addCatalogItem = useStudioProfileStore((s) => s.addCatalogItem)
  const addWork = useStudioProfileStore((s) => s.addWork)
  const addReview = useStudioProfileStore((s) => s.addReview)
  const addSegment = useStudioProfileStore((s) => s.addSegment)
  const addTool = useStudioProfileStore((s) => s.addTool)
  const addProduct = useStudioProfileStore((s) => s.addProduct)

  const viewOptions = VIEW_OPTIONS[tab]
  const safeViewMode = viewOptions.includes(viewMode) ? viewMode : 'list'
  const addLabel = t(ADD_LABEL_KEYS[tab])

  const handleAdd = useCallback(() => {
    switch (tab) {
      case 'groups': {
        const gid = addServiceGroup()
        router.push(studioGroupEditorPath(pathname, gid))
        break
      }
      case 'services': {
        const cid = addCatalogItem()
        router.push(studioCatalogEditorPath(pathname, cid))
        break
      }
      case 'works': {
        const wid = addWork()
        router.push(`${studioWorksBasePath(pathname)}/${wid}`)
        break
      }
      case 'reviews': {
        const rid = addReview()
        router.push(studioReviewEditorPath(pathname, rid))
        break
      }
      case 'segments': {
        const sid = addSegment()
        router.push(studioSegmentEditorPath(pathname, sid))
        break
      }
      case 'tools': {
        const tid = addTool()
        router.push(studioToolEditorPath(pathname, tid))
        break
      }
      case 'products': {
        const pid = addProduct()
        router.push(studioProductEditorPath(pathname, pid))
        break
      }
      case 'playbooks': {
        void createPlaybook({
          name: t('studioSettings.playbooks.defaultName'),
          language: 'de',
          kind: 'first_touch',
          summary: '',
          body: '',
        })
          .then((created) => {
            void queryClient.invalidateQueries({ queryKey: playbooksListQueryKey })
            router.push(studioPlaybookEditorPath(pathname, created.id))
          })
          .catch(() => toast(t('error.somethingWentWrong'), 'error'))
        break
      }
      default:
        break
    }
  }, [
    tab,
    addServiceGroup,
    addCatalogItem,
    addWork,
    addReview,
    addSegment,
    addTool,
    addProduct,
    queryClient,
    t,
    router,
    pathname,
  ])

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={(v) => setSearch(tab, v)}
          placeholder={t('studioSettings.sales.listToolbar.searchPlaceholder')}
          className="w-full sm:w-[260px]"
        />
        <div className="flex min-w-0 shrink-0 flex-nowrap items-center gap-2 overflow-x-auto overscroll-x-contain">
          <StudioAccentAddButton type="button" onClick={handleAdd}>
            {addLabel}
          </StudioAccentAddButton>
          <StudioSalesListFilters tab={tab} />
          <StudioSalesListSort tab={tab} />
          <ViewModeToggle
            mode={safeViewMode}
            onChange={(mode) => setViewMode(tab, mode)}
            options={viewOptions}
          />
        </div>
      </div>
      {resultCount !== undefined ? (
        <p className="text-xs text-muted">
          {t('studioSettings.sales.listToolbar.resultCount', { count: resultCount })}
        </p>
      ) : null}
    </div>
  )
}
