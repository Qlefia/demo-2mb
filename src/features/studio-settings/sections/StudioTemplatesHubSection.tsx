'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Layers, Pencil, Star, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/molecules'
import type { DropdownMenuEntry } from '@/components/molecules'
import {
  StudioSalesListLayout,
  StudioSortableListCard,
  StudioTemplatesListToolbar,
} from '@/features/studio-settings/components'
import { useStudioTemplatesListUiStore } from '@/stores/studioTemplatesListUiStore'
import { useStudioProfileStore } from '@/stores/studioProfileStore'
import { studioTemplateDetailPath } from '@/lib/studio/studioTemplatesPaths'
import type {
  StudioDocumentTemplate,
  StudioDocumentTemplateKind,
} from '@/stores/studioProfileTypes'

const BLOCK_BY_KIND: Record<StudioDocumentTemplateKind, string> = {
  offer: 'studio-templates-offer',
  proposal: 'studio-templates-proposal',
  invoice: 'studio-templates-invoice',
}

function buildSearchHaystack(tpl: StudioDocumentTemplate): string {
  return [tpl.name, tpl.description].join(' ').toLowerCase()
}

type StudioTemplatesHubSectionProps = {
  kind: StudioDocumentTemplateKind
}

export function StudioTemplatesHubSection({ kind }: StudioTemplatesHubSectionProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const templates = useStudioProfileStore((s) => s.general.documentTemplates)
  const sections = useStudioProfileStore((s) => s.general.documentSections)
  const removeDocumentTemplate = useStudioProfileStore((s) => s.removeDocumentTemplate)
  const setDefaultDocumentTemplate = useStudioProfileStore((s) => s.setDefaultDocumentTemplate)
  const reorderDocumentTemplates = useStudioProfileStore((s) => s.reorderDocumentTemplates)
  const setLastKind = useStudioTemplatesListUiStore((s) => s.setLastKind)

  const search = useStudioTemplatesListUiStore((s) => s.search)
  const viewMode = useStudioTemplatesListUiStore((s) => s.viewMode)
  const filter = useStudioTemplatesListUiStore((s) => s.filter)

  const [removeId, setRemoveId] = useState<string | null>(null)

  useEffect(() => {
    setLastKind(kind)
  }, [kind, setLastKind])

  const ofKind = useMemo(() => templates.filter((tpl) => tpl.kind === kind), [templates, kind])

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return ofKind.filter((tpl) => {
      if (filter === 'default' && !tpl.isDefault) return false
      if (filter === 'custom' && tpl.isDefault) return false
      if (needle.length === 0) return true
      return buildSearchHaystack(tpl).includes(needle)
    })
  }, [ofKind, filter, search])

  const filteredIds = filtered.map((tpl) => tpl.id)
  const byId = useMemo(() => new Map(templates.map((tpl) => [tpl.id, tpl])), [templates])
  const sectionsById = useMemo(() => new Map(sections.map((s) => [s.id, s])), [sections])

  const reorderWithinKind = (orderedIds: string[]) => {
    const otherKindIds = templates.filter((tpl) => tpl.kind !== kind).map((tpl) => tpl.id)
    reorderDocumentTemplates([...orderedIds, ...otherKindIds])
  }

  const noResults =
    ofKind.length > 0 && filteredIds.length === 0 && (search.trim().length > 0 || filter !== 'all')

  return (
    <section className="space-y-3">
      <StudioTemplatesListToolbar kind={kind} />

      {ofKind.length === 0 ? (
        <p className="text-sm text-muted">{t(`studioSettings.templates.${kind}.empty`)}</p>
      ) : noResults ? (
        <p className="text-sm text-muted">{t('studioSettings.templates.toolbar.noResults')}</p>
      ) : (
        <StudioSalesListLayout
          blockId={BLOCK_BY_KIND[kind]}
          itemIds={filteredIds}
          listLabel={t(`studioSettings.templates.${kind}.listAria`)}
          viewMode={viewMode}
          isManualOrder={filter === 'all' && search.trim().length === 0}
          onReorder={reorderWithinKind}
        >
          {(id, dragHandle) => {
            const tpl = byId.get(id)
            if (!tpl) return null

            const displayTitle =
              tpl.name.trim() || t('studioSettings.templates.untitled')
            const subtitle = tpl.description.trim() || null
            const sectionsCount = tpl.sectionIds.filter((sid) => sectionsById.has(sid)).length
            const validityText =
              tpl.defaults.validityDays && tpl.defaults.validityDays.length > 0
                ? t('studioSettings.templates.cardValidityDays', { days: tpl.defaults.validityDays })
                : null

            const href = studioTemplateDetailPath(id)
            const menuItems: DropdownMenuEntry[] = [
              {
                label: t('studioSettings.edit'),
                icon: Pencil,
                onClick: () => router.push(href),
              },
              ...(tpl.isDefault
                ? []
                : [
                    {
                      label: t('studioSettings.templates.setDefault'),
                      icon: Star,
                      onClick: () => setDefaultDocumentTemplate(id),
                    } as DropdownMenuEntry,
                  ]),
              { separator: true },
              {
                label: t('studioSettings.templates.remove'),
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
                eyebrow={
                  tpl.isDefault
                    ? t('studioSettings.templates.defaultBadge')
                    : t(`studioSettings.templates.${kind}.kindLabel`)
                }
                title={displayTitle}
                subtitle={null}
                description={subtitle}
                metaLine={{
                  icon: Layers,
                  text: t('studioSettings.templates.cardSectionsCount', { count: sectionsCount }),
                }}
                footerMutedLine={validityText}
              />
            )
          }}
        </StudioSalesListLayout>
      )}

      <ConfirmDialog
        open={removeId !== null}
        onClose={() => setRemoveId(null)}
        onConfirm={() => {
          if (removeId) removeDocumentTemplate(removeId)
          setRemoveId(null)
        }}
        title={t('studioSettings.templates.confirmRemoveTitle')}
        message={t('studioSettings.templates.confirmRemoveBody')}
        variant="destructive"
        confirmLabel={t('studioSettings.templates.remove')}
      />
    </section>
  )
}
