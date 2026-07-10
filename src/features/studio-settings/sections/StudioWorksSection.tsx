'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2 } from 'lucide-react'
import type { DropdownMenuEntry } from '@/components/molecules'
import { ConfirmDialog } from '@/components/molecules'
import {
  StudioSalesListLayout,
  StudioSortableListCard,
  StudioWorksPublicationKanban,
} from '@/features/studio-settings/components'
import { useStudioSalesListIds } from '@/features/studio-settings/lib/useStudioSalesListIds'
import type { StudioSalesListFilter } from '@/features/studio-settings/lib/studioSalesListTypes'
import { stripHtmlToPlain } from '@/features/studio-settings/lib/stripHtmlToPlain'
import { useStudioProfileStore } from '@/stores/studioProfileStore'
import { studioWorkThumbSrc } from '@/features/studio-settings/lib/studioWorkThumb'
import { studioWorksBasePath } from '@/lib/studio/studioSalesPaths'

const BLOCK = 'studio-works'
const PREVIEW_DESC_CHARS = 220
const MAX_SERVICE_CHIPS = 4

export function StudioWorksSection() {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const worksBase = studioWorksBasePath(pathname)
  const works = useStudioProfileStore((s) => s.works)
  const serviceCatalog = useStudioProfileStore((s) => s.serviceCatalog)
  const removeWork = useStudioProfileStore((s) => s.removeWork)
  const reorderWorks = useStudioProfileStore((s) => s.reorderWorks)

  const catalogById = useMemo(
    () => new Map(serviceCatalog.map((c) => [c.id, c])),
    [serviceCatalog],
  )

  const [removeId, setRemoveId] = useState<string | null>(null)

  const ids = works.map((w) => w.id)
  const untitled = t('studioSettings.works.untitled')

  const listState = useStudioSalesListIds({
    tab: 'works',
    sourceIds: ids,
    matchesFilter: useCallback(
      (id, filter: StudioSalesListFilter) => {
        const w = works.find((x) => x.id === id)
        if (!w) return false
        if (filter === 'featured') return w.featured
        if (filter === 'all') return true
        return w.publicationStatus === filter
      },
      [works],
    ),
    getSearchText: useCallback(
      (id) => {
        const w = works.find((x) => x.id === id)
        if (!w) return ''
        const excerpt = stripHtmlToPlain(w.description, PREVIEW_DESC_CHARS)
        return `${w.headline} ${w.title} ${w.clientName} ${w.locationLabel} ${w.tags} ${excerpt}`.trim()
      },
      [works],
    ),
    getTitle: useCallback(
      (id) => {
        const w = works.find((x) => x.id === id)
        if (!w) return untitled
        return w.headline.trim() || w.title.trim() || untitled
      },
      [works, untitled],
    ),
  })

  return (
    <div className="space-y-1">
      {ids.length === 0 ? (
        <p className="text-sm text-muted">{t('studioSettings.works.empty')}</p>
      ) : listState.noResults ? (
        <p className="text-sm text-muted">{t('studioSettings.sales.listToolbar.noResults')}</p>
      ) : listState.viewMode === 'kanban' ? (
        <StudioWorksPublicationKanban workIds={listState.ids} />
      ) : (
        <StudioSalesListLayout
          blockId={BLOCK}
          itemIds={listState.ids}
          listLabel={t('studioSettings.works.listAria')}
          viewMode={listState.viewMode}
          isManualOrder={listState.isManualOrder}
          onReorder={reorderWorks}
        >
              {(id, dragHandle) => {
                const w = works.find((x) => x.id === id)
                if (!w) return null
                const displayTitle =
                  w.headline.trim() || w.title.trim() || t('studioSettings.works.untitled')
                const excerpt = stripHtmlToPlain(w.description, PREVIEW_DESC_CHARS).trim()
                const thumb = studioWorkThumbSrc(w)
                const chipEntries = w.linkedCatalogIds
                  .map((cid) => {
                    const line = catalogById.get(cid)
                    const title = line?.title.trim()
                    return title ? { cid, title } : null
                  })
                  .filter((x): x is { cid: string; title: string } => x !== null)
                const shownChips = chipEntries.slice(0, MAX_SERVICE_CHIPS)
                const moreServices = Math.max(0, chipEntries.length - shownChips.length)
                const tagsFallback = w.tags.trim()
                const client = w.clientName.trim()
                const location = w.locationLabel.trim()
                const metaParts = [client, location].filter(Boolean)
                const metaLine = metaParts.join(metaParts.length === 2 ? ' · ' : '')
                const workHref = `${worksBase}/${id}`
                const workMenuItems: DropdownMenuEntry[] = [
                  {
                    label: t('studioSettings.edit'),
                    icon: Pencil,
                    onClick: () => router.push(workHref),
                  },
                  { separator: true },
                  {
                    label: t('studioSettings.remove'),
                    icon: Trash2,
                    variant: 'destructive',
                    onClick: () => setRemoveId(id),
                  },
                ]

                return (
                  <StudioSortableListCard
                    dragHandle={dragHandle}
                    href={workHref}
                    menuTriggerAriaLabel={t('studioSettings.sortableListCardMenuAria')}
                    menuItems={workMenuItems}
                    thumbnailUrl={thumb}
                    eyebrow={w.categoryLabel.trim() || null}
                    title={displayTitle}
                    subtitle={metaLine.length > 0 ? metaLine : null}
                    description={excerpt.length > 0 ? excerpt : null}
                    chips={shownChips.map(({ cid, title: chipTitle }) => ({ id: cid, label: chipTitle }))}
                    chipsOverflowCount={moreServices}
                    chipsOverflowLabel={
                      moreServices > 0
                        ? t('studioSettings.works.listPreview.moreServices', { count: moreServices })
                        : null
                    }
                    tagsFallback={tagsFallback.length > 0 ? tagsFallback : null}
                  />
                )
              }}
        </StudioSalesListLayout>
      )}

      <ConfirmDialog
        open={removeId !== null}
        onClose={() => setRemoveId(null)}
        onConfirm={() => {
          if (removeId) removeWork(removeId)
          setRemoveId(null)
        }}
        title={t('studioSettings.works.confirmRemoveTitle')}
        message={t('studioSettings.works.confirmRemoveBody')}
        variant="destructive"
        confirmLabel={t('studioSettings.remove')}
      />
    </div>
  )
}
