'use client'

import { useCallback, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2 } from 'lucide-react'
import type { DropdownMenuEntry } from '@/components/molecules'
import { ConfirmDialog } from '@/components/molecules'
import { StudioSalesListLayout, StudioSortableListCard } from '@/features/studio-settings/components'
import { useStudioSalesListIds } from '@/features/studio-settings/lib/useStudioSalesListIds'
import type { StudioSalesListFilter } from '@/features/studio-settings/lib/studioSalesListTypes'
import { studioDualBannerThumbnail } from '@/features/studio-settings/lib/studioDualBannerThumbnail'
import { stripHtmlToPlain } from '@/features/studio-settings/lib/stripHtmlToPlain'
import { useStudioProfileStore } from '@/stores/studioProfileStore'
import { studioSegmentEditorPath } from '@/lib/studio/studioSalesPaths'

const BLOCK = 'studio-segments'
const PREVIEW_DESC_CHARS = 200

export function StudioSegmentsSection() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const router = useRouter()
  const segments = useStudioProfileStore((s) => s.segments)
  const removeSegment = useStudioProfileStore((s) => s.removeSegment)
  const reorderSegments = useStudioProfileStore((s) => s.reorderSegments)

  const [removeId, setRemoveId] = useState<string | null>(null)

  const ids = segments.map((s) => s.id)
  const untitled = t('studioSettings.segments.untitled')

  const listState = useStudioSalesListIds({
    tab: 'segments',
    sourceIds: ids,
    matchesFilter: useCallback((_id, _filter: StudioSalesListFilter) => true, []),
    getSearchText: useCallback(
      (id) => {
        const row = segments.find((s) => s.id === id)
        if (!row) return ''
        const excerpt = stripHtmlToPlain(row.description, PREVIEW_DESC_CHARS)
        return `${row.title} ${row.subheader} ${row.headline} ${row.subtitle} ${excerpt}`.trim()
      },
      [segments],
    ),
    getTitle: useCallback(
      (id) => {
        const row = segments.find((s) => s.id === id)
        if (!row) return untitled
        return row.title.trim() || row.headline.trim() || untitled
      },
      [segments, untitled],
    ),
  })

  return (
    <div className="space-y-1">
      {ids.length === 0 ? (
        <p className="text-sm text-muted">{t('studioSettings.segments.empty')}</p>
      ) : listState.noResults ? (
        <p className="text-sm text-muted">{t('studioSettings.sales.listToolbar.noResults')}</p>
      ) : (
        <StudioSalesListLayout
          blockId={BLOCK}
          itemIds={listState.ids}
          listLabel={t('studioSettings.segments.listAria')}
          viewMode={listState.viewMode === 'kanban' ? 'list' : listState.viewMode}
          isManualOrder={listState.isManualOrder}
          onReorder={reorderSegments}
        >
          {(id, dragHandle) => {
            const row = segments.find((s) => s.id === id)
            if (!row) return null
            const title = row.title.trim() || row.headline.trim() || untitled
            const subtitleParts = [row.subheader.trim(), row.headline.trim() !== title ? row.headline.trim() : '']
              .filter(Boolean)
            const subtitle = subtitleParts.join(' · ')
            const excerpt = stripHtmlToPlain(row.description, PREVIEW_DESC_CHARS).trim()
            const thumb =
              row.bannerMode === 'image'
                ? studioDualBannerThumbnail(row.bannerDataUrl, row.bannerPortraitDataUrl)
                : null
            const href = studioSegmentEditorPath(pathname, id)
            const menuItems: DropdownMenuEntry[] = [
              { label: t('studioSettings.edit'), icon: Pencil, onClick: () => router.push(href) },
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
                href={href}
                menuTriggerAriaLabel={t('studioSettings.sortableListCardMenuAria')}
                menuItems={menuItems}
                thumbnailUrl={thumb}
                title={title}
                subtitle={subtitle.length > 0 ? subtitle : null}
                description={excerpt.length > 0 ? excerpt : null}
              />
            )
          }}
        </StudioSalesListLayout>
      )}

      <ConfirmDialog
        open={removeId !== null}
        onClose={() => setRemoveId(null)}
        onConfirm={() => {
          if (removeId) removeSegment(removeId)
          setRemoveId(null)
        }}
        title={t('studioSettings.segments.confirmRemoveTitle')}
        message={t('studioSettings.segments.confirmRemoveBody')}
        variant="destructive"
        confirmLabel={t('studioSettings.remove')}
      />
    </div>
  )
}
