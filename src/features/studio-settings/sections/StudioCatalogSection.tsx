'use client'

import { useCallback, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Pencil, Trash2 } from 'lucide-react'
import type { DropdownMenuEntry } from '@/components/molecules'
import { ConfirmDialog } from '@/components/molecules'
import { StudioSalesListLayout, StudioSortableListCard } from '@/features/studio-settings/components'
import { useStudioSalesListIds } from '@/features/studio-settings/lib/useStudioSalesListIds'
import type { StudioSalesListFilter } from '@/features/studio-settings/lib/studioSalesListTypes'
import { buildGroupChipsForCatalogLine } from '@/features/studio-settings/lib/catalogLineGroupChips'
import { catalogLineListThumbnail } from '@/features/studio-settings/lib/catalogLineThumbnail'
import { stripHtmlToPlain } from '@/features/studio-settings/lib/stripHtmlToPlain'
import {
  formatPriceTierSummary,
  getActivePriceTier,
} from '@/features/studio-settings/lib/studioPriceTiers'
import { useStudioProfileStore, getStudioServiceGroupTitle } from '@/stores/studioProfileStore'
import { studioCatalogEditorPath } from '@/lib/studio/studioSalesPaths'

const BLOCK = 'studio-svc-catalog'
const DESC_PREVIEW_CHARS = 200

function catalogSubtitle(row: {
  code: string
  priceTiers: Parameters<typeof getActivePriceTier>[0]
  activePriceTierId: string | null
}): string | null {
  const parts: string[] = []
  const code = row.code.trim()
  if (code) parts.push(code)
  const tier = getActivePriceTier(row.priceTiers, row.activePriceTierId)
  const pricing = formatPriceTierSummary(tier)
  if (pricing) parts.push(pricing)
  return parts.length > 0 ? parts.join(' · ') : null
}

export function StudioCatalogSection() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const router = useRouter()
  const serviceCatalog = useStudioProfileStore((s) => s.serviceCatalog)
  const serviceGroups = useStudioProfileStore((s) => s.serviceGroups)
  const removeCatalogItem = useStudioProfileStore((s) => s.removeCatalogItem)
  const reorderCatalog = useStudioProfileStore((s) => s.reorderCatalog)

  const [removeId, setRemoveId] = useState<string | null>(null)

  const catalogIds = serviceCatalog.map((c) => c.id)
  const untitledGroup = t('studioSettings.services.untitledGroup')

  const groupTitle = useMemo(
    () => (groupId: string) => getStudioServiceGroupTitle(serviceGroups, groupId, untitledGroup),
    [serviceGroups, untitledGroup],
  )

  const catalogInGroup = useCallback(
    (catalogId: string) => serviceGroups.some((g) => g.memberIds.includes(catalogId)),
    [serviceGroups],
  )

  const listState = useStudioSalesListIds({
    tab: 'services',
    sourceIds: catalogIds,
    matchesFilter: useCallback(
      (id, filter: StudioSalesListFilter) => {
        if (filter === 'inGroup') return catalogInGroup(id)
        if (filter === 'ungrouped') return !catalogInGroup(id)
        return true
      },
      [catalogInGroup],
    ),
    getSearchText: useCallback(
      (id) => {
        const row = serviceCatalog.find((c) => c.id === id)
        if (!row) return ''
        const desc = stripHtmlToPlain(row.description, DESC_PREVIEW_CHARS)
        return `${row.title} ${row.summary} ${row.code} ${desc}`.trim()
      },
      [serviceCatalog],
    ),
    getTitle: useCallback(
      (id) => {
        const row = serviceCatalog.find((c) => c.id === id)
        return row?.title.trim() || t('studioSettings.services.unnamedLine')
      },
      [serviceCatalog, t],
    ),
  })

  return (
    <div className="space-y-1">
      {catalogIds.length === 0 ? (
        <p className="text-sm text-muted">{t('studioSettings.services.catalogEmpty')}</p>
      ) : listState.noResults ? (
        <p className="text-sm text-muted">{t('studioSettings.sales.listToolbar.noResults')}</p>
      ) : (
        <StudioSalesListLayout
          blockId={BLOCK}
          itemIds={listState.ids}
          listLabel={t('studioSettings.services.catalogListAria')}
          viewMode={listState.viewMode}
          isManualOrder={listState.isManualOrder}
          onReorder={reorderCatalog}
        >
          {(id, dragHandle) => {
            const row = serviceCatalog.find((c) => c.id === id)
            if (!row) return null
            const title = row.title.trim() || t('studioSettings.services.unnamedLine')
            const description = stripHtmlToPlain(row.description, DESC_PREVIEW_CHARS).trim() || null
            const { chips, overflowCount } = buildGroupChipsForCatalogLine(id, serviceGroups, groupTitle)
            const href = studioCatalogEditorPath(pathname, id)
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
                thumbnailUrl={catalogLineListThumbnail(row)}
                title={title}
                subtitle={catalogSubtitle(row)}
                description={description}
                chips={chips}
                chipsSectionLabel={
                  chips.length > 0 ? t('studioSettings.services.catalogListGroupsLabel') : null
                }
                chipsOverflowCount={overflowCount}
                chipsOverflowLabel={
                  overflowCount > 0
                    ? t('studioSettings.services.catalogListMoreGroups', { count: overflowCount })
                    : null
                }
                tagsFallback={
                  chips.length === 0 ? t('studioSettings.services.catalogListNoGroups') : null
                }
              />
            )
          }}
        </StudioSalesListLayout>
      )}

      <ConfirmDialog
        open={removeId !== null}
        onClose={() => setRemoveId(null)}
        onConfirm={() => {
          if (removeId) removeCatalogItem(removeId)
          setRemoveId(null)
        }}
        title={t('studioSettings.services.confirmRemoveLineTitle')}
        message={t('studioSettings.services.confirmRemoveLineBody')}
        variant="destructive"
        confirmLabel={t('studioSettings.remove')}
      />
    </div>
  )
}
