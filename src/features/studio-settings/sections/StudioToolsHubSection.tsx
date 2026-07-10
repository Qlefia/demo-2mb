'use client'

import { useCallback, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2 } from 'lucide-react'
import type { DropdownMenuEntry } from '@/components/molecules'
import { ConfirmDialog } from '@/components/molecules'
import { StudioSalesListLayout, StudioSortableListCard } from '@/features/studio-settings/components'
import type { StudioSortableListChip } from '@/features/studio-settings/components/StudioSortableListCard'
import { useStudioSalesListIds } from '@/features/studio-settings/lib/useStudioSalesListIds'
import type { StudioSalesListFilter } from '@/features/studio-settings/lib/studioSalesListTypes'
import { stripHtmlToPlain } from '@/features/studio-settings/lib/stripHtmlToPlain'
import { useStudioProfileStore } from '@/stores/studioProfileStore'
import { studioToolEditorPath } from '@/lib/studio/studioSalesPaths'

const BLOCK = 'studio-tools'
const DESC_PREVIEW_CHARS = 180

export function StudioToolsHubSection() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const router = useRouter()
  const tools = useStudioProfileStore((s) => s.tools)
  const works = useStudioProfileStore((s) => s.works)
  const removeTool = useStudioProfileStore((s) => s.removeTool)
  const reorderTools = useStudioProfileStore((s) => s.reorderTools)

  const [removeId, setRemoveId] = useState<string | null>(null)

  const toolIds = tools.map((tool) => tool.id)

  const usageByTool = useMemo(() => {
    const counts = new Map<string, number>()
    for (const w of works) {
      for (const tid of w.linkedToolIds ?? []) {
        counts.set(tid, (counts.get(tid) ?? 0) + 1)
      }
    }
    return counts
  }, [works])

  const listState = useStudioSalesListIds({
    tab: 'tools',
    sourceIds: toolIds,
    matchesFilter: useCallback(
      (id, filter: StudioSalesListFilter) => {
        if (filter === 'all') return true
        const tool = tools.find((x) => x.id === id)
        if (!tool) return false
        if (filter === 'featured') return tool.featured
        return tool.category === filter
      },
      [tools],
    ),
    getSearchText: useCallback(
      (id) => {
        const tool = tools.find((x) => x.id === id)
        if (!tool) return ''
        const desc = stripHtmlToPlain(tool.description, DESC_PREVIEW_CHARS)
        return `${tool.name} ${tool.vendor} ${tool.summary} ${desc}`.trim()
      },
      [tools],
    ),
    getTitle: useCallback(
      (id) => {
        const tool = tools.find((x) => x.id === id)
        return tool?.name.trim() || t('studioSettings.tools.untitled')
      },
      [tools, t],
    ),
  })

  return (
    <div className="space-y-1">
      {toolIds.length === 0 ? (
        <p className="text-sm text-muted">{t('studioSettings.tools.empty')}</p>
      ) : listState.noResults ? (
        <p className="text-sm text-muted">{t('studioSettings.sales.listToolbar.noResults')}</p>
      ) : (
        <StudioSalesListLayout
          blockId={BLOCK}
          itemIds={listState.ids}
          listLabel={t('studioSettings.tools.listAria')}
          viewMode={listState.viewMode}
          isManualOrder={listState.isManualOrder}
          onReorder={reorderTools}
        >
          {(id, dragHandle) => {
            const tool = tools.find((x) => x.id === id)
            if (!tool) return null
            const title = tool.name.trim() || t('studioSettings.tools.untitled')
            const description =
              stripHtmlToPlain(tool.description, DESC_PREVIEW_CHARS).trim() || tool.summary.trim() || null
            const href = studioToolEditorPath(pathname, id)
            const usage = usageByTool.get(id) ?? 0
            const chips: StudioSortableListChip[] = []
            chips.push({
              id: 'category',
              kind: 'plain',
              label: t(`studioSettings.tools.category.${tool.category}`),
            })
            if (tool.vendor.trim()) {
              chips.push({ id: 'vendor', kind: 'plain', label: tool.vendor.trim() })
            }
            if (usage > 0) {
              chips.push({
                id: 'usage',
                kind: 'plain',
                label: t('studioSettings.tools.usedInWorks', { count: usage }),
              })
            }
            const menuItems: DropdownMenuEntry[] = [
              {
                label: t('studioSettings.edit'),
                icon: Pencil,
                onClick: () => router.push(href),
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
                href={href}
                menuTriggerAriaLabel={t('studioSettings.sortableListCardMenuAria')}
                menuItems={menuItems}
                thumbnailUrl={tool.iconDataUrl ?? null}
                eyebrow={tool.featured ? t('studioSettings.tools.featured') : null}
                title={title}
                subtitle={tool.summary.trim() || null}
                description={description}
                chips={chips}
              />
            )
          }}
        </StudioSalesListLayout>
      )}

      <ConfirmDialog
        open={removeId !== null}
        onClose={() => setRemoveId(null)}
        onConfirm={() => {
          if (removeId) removeTool(removeId)
          setRemoveId(null)
        }}
        title={t('studioSettings.tools.confirmRemoveTitle')}
        message={t('studioSettings.tools.confirmRemoveBody')}
        variant="destructive"
        confirmLabel={t('studioSettings.remove')}
      />
    </div>
  )
}
