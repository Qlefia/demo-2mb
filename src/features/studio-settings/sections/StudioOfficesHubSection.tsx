'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { MapPin, Pencil, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/molecules'
import type { DropdownMenuEntry } from '@/components/molecules'
import {
  StudioSalesListLayout,
  StudioOfficesListToolbar,
  StudioSortableListCard,
} from '@/features/studio-settings/components'
import { useStudioOfficesListUiStore } from '@/stores/studioOfficesListUiStore'
import { useStudioProfileStore } from '@/stores/studioProfileStore'
import { studioOfficeDetailPath } from '@/lib/studio/studioOfficesPaths'
import type { StudioOffice } from '@/stores/studioProfileTypes'

const BLOCK = 'studio-offices'

function getKindLabel(kind: StudioOffice['kind'], t: (key: string) => string): string {
  if (kind === 'physical') return t('studioSettings.general.offices.kindPhysical')
  if (kind === 'virtual') return t('studioSettings.general.offices.kindVirtual')
  return t('studioSettings.general.offices.kindLegalRegistered')
}

function buildSearchHaystack(office: StudioOffice): string {
  return [
    office.label,
    office.city,
    office.addressLine,
    office.postalCode,
    office.contactName,
    office.contactEmail,
    office.notes,
  ]
    .join(' ')
    .toLowerCase()
}

export function StudioOfficesHubSection() {
  const { t } = useTranslation()
  const router = useRouter()
  const offices = useStudioProfileStore((s) => s.general.studioOffices)
  const removeOffice = useStudioProfileStore((s) => s.removeOffice)
  const reorderOffices = useStudioProfileStore((s) => s.reorderOffices)

  const search = useStudioOfficesListUiStore((s) => s.search)
  const viewMode = useStudioOfficesListUiStore((s) => s.viewMode)
  const filter = useStudioOfficesListUiStore((s) => s.filter)

  const [removeId, setRemoveId] = useState<string | null>(null)

  const filteredOffices = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return offices.filter((o) => {
      if (filter !== 'all' && o.kind !== filter) return false
      if (needle.length === 0) return true
      return buildSearchHaystack(o).includes(needle)
    })
  }, [offices, search, filter])

  const filteredIds = filteredOffices.map((o) => o.id)
  const officeById = useMemo(() => new Map(offices.map((o) => [o.id, o])), [offices])

  const noResults =
    offices.length > 0 && filteredIds.length === 0 && (search.trim().length > 0 || filter !== 'all')

  return (
    <section className="space-y-3">
      <StudioOfficesListToolbar />

      {offices.length === 0 ? (
        <p className="text-sm text-muted">{t('studioSettings.general.offices.empty')}</p>
      ) : noResults ? (
        <p className="text-sm text-muted">{t('studioSettings.general.offices.toolbar.noResults')}</p>
      ) : (
        <StudioSalesListLayout
          blockId={BLOCK}
          itemIds={filteredIds}
          listLabel={t('studioSettings.general.offices.listAria')}
          viewMode={viewMode}
          isManualOrder={filter === 'all' && search.trim().length === 0}
          onReorder={reorderOffices}
        >
          {(id, dragHandle) => {
            const office = officeById.get(id)
            if (!office) return null

            const displayTitle =
              office.label.trim() ||
              office.city.trim() ||
              t('studioSettings.general.offices.untitled')

            const addressLine = [office.addressLine.trim(), office.postalCode.trim(), office.city.trim()]
              .filter(Boolean)
              .join(', ')

            const href = studioOfficeDetailPath(id)
            const menuItems: DropdownMenuEntry[] = [
              {
                label: t('studioSettings.edit'),
                icon: Pencil,
                onClick: () => router.push(href),
              },
              { separator: true },
              {
                label: t('studioSettings.general.offices.remove'),
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
                thumbnailUrl={office.coverImageDataUrl ?? undefined}
                eyebrow={getKindLabel(office.kind, t)}
                title={displayTitle}
                subtitle={office.city.trim() || null}
                description={office.notes.trim() || null}
                metaLine={
                  addressLine.length > 0 ? { icon: MapPin, text: addressLine } : null
                }
                footerMutedLine={
                  office.latitude !== null && office.longitude !== null
                    ? t('studioSettings.general.offices.pinnedAt', {
                        lat: office.latitude.toFixed(4),
                        lng: office.longitude.toFixed(4),
                      })
                    : null
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
          if (removeId) removeOffice(removeId)
          setRemoveId(null)
        }}
        title={t('studioSettings.general.offices.confirmRemoveTitle')}
        message={t('studioSettings.general.offices.confirmRemoveBody')}
        variant="destructive"
        confirmLabel={t('studioSettings.general.offices.remove')}
      />
    </section>
  )
}
