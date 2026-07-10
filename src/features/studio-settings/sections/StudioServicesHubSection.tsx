'use client'

import { useCallback, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button, Input } from '@/components/atoms'
import { ConfirmDialog, SearchInput } from '@/components/molecules'
import { Select } from '@/components/molecules/Select'
import { SortableFieldRows } from '@/features/proposals/SortableFieldRows'
import {
  studioBlockStack,
  studioCatalogOverviewChip,
  studioChipCluster,
  studioEditorPanel,
  studioSectionStack,
  studioWorkspaceBody,
  studioWorkspaceList,
  studioWorkspaceZone,
} from '@/features/studio-settings/studioBlockChrome'
import {
  StudioCollapsibleSectionsToolbar,
  StudioMinimalCollapsibleSection,
  StudioFieldHeader,
  StudioFlatSection,
  StudioRichTextField,
  StudioSalesListLayout,
  StudioSortableListCard,
} from '@/features/studio-settings/components'
import { StudioCatalogLineRelationsFields } from '@/features/studio-settings/components/StudioCatalogLineRelationsFields'
import { useStudioSalesListIds } from '@/features/studio-settings/lib/useStudioSalesListIds'
import type { StudioSalesListFilter } from '@/features/studio-settings/lib/studioSalesListTypes'
import { isKeyOpen, sectionOpenMap } from '@/features/studio-settings/lib/studioSectionCollapse'
import { buildCatalogMemberChips } from '@/features/studio-settings/lib/catalogMemberChips'
import {
  studioCatalogPickerRowId,
  useStudioCatalogPickerScroll,
} from '@/features/studio-settings/lib/useStudioCatalogPickerScroll'
import { catalogLinePatchForTitleChange } from '@/features/studio-settings/lib/catalogLineTitlePatch'
import { studioDualBannerThumbnail } from '@/features/studio-settings/lib/studioDualBannerThumbnail'
import { stripHtmlToPlain } from '@/features/studio-settings/lib/stripHtmlToPlain'
import { STUDIO_SERVICE_CATALOG_LIMITS } from '@/features/studio-settings/constants'
import { useStudioProfileStore, getStudioServiceGroupTitle } from '@/stores/studioProfileStore'
import type { StudioServiceCatalogItem } from '@/stores/studioProfileTypes'
import { studioGroupEditorPath } from '@/lib/studio/studioSalesPaths'
import type { DropdownMenuEntry } from '@/components/molecules'
import { cn } from '@/lib/cn'

function catalogItemMatchesOverviewQuery(row: StudioServiceCatalogItem, q: string): boolean {
  if (!q) return true
  const d = stripHtmlToPlain(row.description, 2000).toLowerCase()
  return (
    row.title.toLowerCase().includes(q) ||
    row.summary.toLowerCase().includes(q) ||
    row.code.toLowerCase().includes(q) ||
    d.includes(q)
  )
}

const CATALOG_BLOCK = 'studio-svc-catalog'
const GROUP_BLOCK = 'studio-svc-groups'
const GROUP_CARD_DESC_PREVIEW = 200

const SERVICES_HUB_KEYS = ['catalog', 'groups'] as const
type ServicesHubSectionKey = (typeof SERVICES_HUB_KEYS)[number]

export type StudioServicesHubView = 'full' | 'catalog' | 'groups'

type StudioServicesHubSectionProps = {
  /** `full` = legacy combined hub; Sales uses `catalog` or `groups` on separate tabs. */
  view?: StudioServicesHubView
}

export function StudioServicesHubSection({ view = 'full' }: StudioServicesHubSectionProps) {
  const { t } = useTranslation()
  const pathname = usePathname()
  const router = useRouter()
  const serviceCatalog = useStudioProfileStore((s) => s.serviceCatalog)
  const serviceGroups = useStudioProfileStore((s) => s.serviceGroups)
  const works = useStudioProfileStore((s) => s.works)
  const addCatalogItem = useStudioProfileStore((s) => s.addCatalogItem)
  const updateCatalogItem = useStudioProfileStore((s) => s.updateCatalogItem)
  const removeCatalogItem = useStudioProfileStore((s) => s.removeCatalogItem)
  const reorderCatalog = useStudioProfileStore((s) => s.reorderCatalog)
  const appendServiceGroupMember = useStudioProfileStore((s) => s.appendServiceGroupMember)
  const removeServiceGroup = useStudioProfileStore((s) => s.removeServiceGroup)
  const reorderServiceGroups = useStudioProfileStore((s) => s.reorderServiceGroups)

  const [removeCatalogId, setRemoveCatalogId] = useState<string | null>(null)
  const [removeGroupId, setRemoveGroupId] = useState<string | null>(null)
  const [catalogOverviewQuery, setCatalogOverviewQuery] = useState('')
  const sectionKeys: readonly ServicesHubSectionKey[] =
    view === 'catalog' ? (['catalog'] as const) : view === 'groups' ? (['groups'] as const) : SERVICES_HUB_KEYS

  const [sectionsOpen, setSectionsOpen] = useState<Record<ServicesHubSectionKey, boolean>>(() =>
    sectionOpenMap(SERVICES_HUB_KEYS, true),
  )

  const catalogIds = serviceCatalog.map((c) => c.id)
  const groupIds = serviceGroups.map((g) => g.id)
  const untitledGroupLabel = t('studioSettings.services.untitledGroup')

  const groupsListState = useStudioSalesListIds({
    tab: 'groups',
    sourceIds: groupIds,
    matchesFilter: useCallback(
      (id, filter: StudioSalesListFilter) => {
        const g = serviceGroups.find((x) => x.id === id)
        if (!g) return false
        if (filter === 'hasServices') return g.memberIds.length > 0
        if (filter === 'empty') return g.memberIds.length === 0
        return true
      },
      [serviceGroups],
    ),
    getSearchText: useCallback(
      (id) => {
        const g = serviceGroups.find((x) => x.id === id)
        if (!g) return ''
        const title = getStudioServiceGroupTitle(serviceGroups, id, untitledGroupLabel)
        const desc = stripHtmlToPlain(g.description, GROUP_CARD_DESC_PREVIEW)
        return `${title} ${desc}`.trim()
      },
      [serviceGroups, untitledGroupLabel],
    ),
    getTitle: useCallback(
      (id) => getStudioServiceGroupTitle(serviceGroups, id, untitledGroupLabel),
      [serviceGroups, untitledGroupLabel],
    ),
  })

  const catalogById = useMemo(
    () => new Map(serviceCatalog.map((c) => [c.id, c])),
    [serviceCatalog],
  )
  useStudioCatalogPickerScroll(catalogIds)

  const allSectionsExpanded = useMemo(
    () => sectionKeys.every((k) => isKeyOpen(sectionsOpen, k)),
    [sectionsOpen, sectionKeys],
  )

  const toggleSection = (key: ServicesHubSectionKey) => {
    setSectionsOpen((prev) => ({ ...prev, [key]: !isKeyOpen(prev, key) }))
  }

  const workOptions = useMemo(
    () => [
      { value: '', label: t('studioSettings.services.linkedWorkNone') },
      ...works.map((w) => ({
        value: w.id,
        label: w.title.trim() || t('studioSettings.works.untitled'),
      })),
    ],
    [works, t],
  )

  const showCatalog = view === 'full' || view === 'catalog'
  const showGroups = view === 'full' || view === 'groups'

  function renderCatalogList() {
    const overviewQ = catalogOverviewQuery.trim().toLowerCase()
    const overviewChipIds = catalogIds.filter((cid) => {
      if (!overviewQ) return true
      const row = serviceCatalog.find((c) => c.id === cid)
      return row ? catalogItemMatchesOverviewQuery(row, overviewQ) : false
    })

    return (
      <div className={studioSectionStack}>
        {catalogIds.length > 0 ? (
          <div className={studioBlockStack}>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {t('studioSettings.services.catalogOverviewTitle')}
            </p>
            <SearchInput
              value={catalogOverviewQuery}
              onChange={setCatalogOverviewQuery}
              placeholder={t('studioSettings.services.catalogOverviewSearchPlaceholder')}
            />
            {overviewChipIds.length === 0 ? (
              <p className="text-sm text-muted">{t('studioSettings.services.catalogOverviewEmpty')}</p>
            ) : (
              <div className={studioChipCluster}>
                {overviewChipIds.map((cid) => {
                    const row = serviceCatalog.find((c) => c.id === cid)
                    const label = row?.title.trim() || t('studioSettings.services.unnamedLine')
                    return (
                      <button
                        key={cid}
                        type="button"
                        className={studioCatalogOverviewChip}
                        title={label}
                        onClick={() =>
                          document
                            .getElementById(studioCatalogPickerRowId(cid))
                            ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }
                      >
                        {label}
                      </button>
                    )
                })}
              </div>
            )}
          </div>
        ) : null}

        <div className={cn(catalogIds.length > 0 ? studioWorkspaceZone : studioBlockStack)}>
          {catalogIds.length > 0 ? (
            <p className="text-xs text-muted">{t('studioSettings.services.catalogOverviewHint')}</p>
          ) : null}
          {catalogIds.length === 0 ? (
            <p className="text-sm text-muted">{t('studioSettings.services.catalogEmpty')}</p>
          ) : (
            <SortableFieldRows
              blockId={CATALOG_BLOCK}
              itemIds={catalogIds}
              onReorder={reorderCatalog}
              listLabel={t('studioSettings.services.catalogListAria')}
              alignStart
              containerClassName={studioWorkspaceList}
            >
            {(id, dragHandle) => {
              const row = serviceCatalog.find((c) => c.id === id)
              if (!row) return null
              return (
                <div id={studioCatalogPickerRowId(id)} className={studioEditorPanel}>
                  <div className="flex gap-2">
                    {dragHandle}
                    <div className={cn('min-w-0 flex-1', studioWorkspaceBody)}>
                      <div className="studio-field-stack">
                        <StudioFieldHeader
                          htmlFor={`cat-title-${id}`}
                          label={t('studioSettings.services.lineTitle')}
                          showAi={false}
                        />
                        <Input
                          id={`cat-title-${id}`}
                          value={row.title}
                          onChange={(e) =>
                            updateCatalogItem(
                              id,
                              catalogLinePatchForTitleChange(row.title, e.target.value),
                            )
                          }
                          maxLength={STUDIO_SERVICE_CATALOG_LIMITS.title}
                        />
                      </div>
                      <div className="studio-field-stack">
                        <StudioFieldHeader
                          htmlFor={`cat-desc-${id}`}
                          label={t('studioSettings.services.lineDescription')}
                          hint={t('studioSettings.services.lineDescriptionHint')}
                          showAi={false}
                        />
                        <StudioRichTextField
                          id={`cat-desc-${id}`}
                          value={row.description}
                          onChange={(html) => updateCatalogItem(id, { description: html })}
                          placeholder={t('studioSettings.richText.serviceLinePlaceholder')}
                          minHeightClass="min-h-[6rem]"
                        />
                      </div>
                      <div className="grid gap-[var(--studio-stack-block-gap)] sm:grid-cols-2">
                        <div className="studio-field-stack">
                          <StudioFieldHeader
                            htmlFor={`cat-code-${id}`}
                            label={t('studioSettings.services.lineCode')}
                            showAi={false}
                          />
                          <Input
                            id={`cat-code-${id}`}
                            value={row.code}
                            onChange={(e) => updateCatalogItem(id, { code: e.target.value })}
                            maxLength={STUDIO_SERVICE_CATALOG_LIMITS.code}
                            placeholder={t('studioSettings.services.lineCodePlaceholder')}
                          />
                        </div>
                        <div className="studio-field-stack">
                          <StudioFieldHeader
                            htmlFor={`cat-url-${id}`}
                            label={t('studioSettings.services.lineExternalUrl')}
                            showAi={false}
                          />
                          <Input
                            id={`cat-url-${id}`}
                            type="url"
                            inputMode="url"
                            autoComplete="off"
                            value={row.externalUrl}
                            onChange={(e) => updateCatalogItem(id, { externalUrl: e.target.value })}
                            maxLength={STUDIO_SERVICE_CATALOG_LIMITS.externalUrl}
                            placeholder={t('studioSettings.services.lineExternalUrlPlaceholder')}
                          />
                        </div>
                      </div>
                      <div className="studio-field-stack">
                        <StudioFieldHeader label={t('studioSettings.services.lineLinkedWork')} showAi={false} />
                        <Select
                          value={row.linkedWorkId ?? ''}
                          onChange={(v) => updateCatalogItem(id, { linkedWorkId: v === '' ? null : v })}
                          options={workOptions}
                          placeholder={t('studioSettings.services.linkedWorkNone')}
                        />
                      </div>
                      <StudioCatalogLineRelationsFields catalogLineId={id} />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-muted hover:text-destructive"
                      aria-label={t('studioSettings.remove')}
                      onClick={() => setRemoveCatalogId(id)}
                    >
                      <Trash2 size={16} aria-hidden />
                    </Button>
                  </div>
                </div>
              )
            }}
            </SortableFieldRows>
          )}

        </div>
      </div>
    )
  }

  function renderGroupsList() {
    return (
      <div className={studioBlockStack}>
        {groupIds.length === 0 ? (
          <p className="text-sm text-muted">{t('studioSettings.services.groupsEmpty')}</p>
        ) : groupsListState.noResults ? (
          <p className="text-sm text-muted">{t('studioSettings.sales.listToolbar.noResults')}</p>
        ) : (
          <StudioSalesListLayout
            blockId={GROUP_BLOCK}
            itemIds={groupsListState.ids}
            listLabel={t('studioSettings.services.groupsListAria')}
            viewMode={groupsListState.viewMode === 'kanban' ? 'list' : groupsListState.viewMode}
            isManualOrder={groupsListState.isManualOrder}
            onReorder={reorderServiceGroups}
            alignStart
          >
            {(id, dragHandle) => {
              const g = serviceGroups.find((x) => x.id === id)
              if (!g) return null
              const idx = groupIds.indexOf(id)
              const label = getStudioServiceGroupTitle(
                serviceGroups,
                id,
                t('studioSettings.services.untitledGroup'),
              )
              const moveUp = () => {
                if (idx <= 0) return
                const next = [...groupIds]
                const t0 = next[idx - 1]
                const t1 = next[idx]
                if (t0 === undefined || t1 === undefined) return
                next[idx - 1] = t1
                next[idx] = t0
                reorderServiceGroups(next)
              }
              const moveDown = () => {
                if (idx < 0 || idx >= groupIds.length - 1) return
                const next = [...groupIds]
                const t0 = next[idx]
                const t1 = next[idx + 1]
                if (t0 === undefined || t1 === undefined) return
                next[idx] = t1
                next[idx + 1] = t0
                reorderServiceGroups(next)
              }
              const descPreview = stripHtmlToPlain(g.description, GROUP_CARD_DESC_PREVIEW).trim()
              const unnamedLine = t('studioSettings.services.unnamedLine')
              const { chips: memberChips, overflowCount: moreMembers } = buildCatalogMemberChips(
                g.memberIds,
                catalogById,
                unnamedLine,
              )
              const quickAddServiceToGroup = () => {
                const newId = addCatalogItem()
                appendServiceGroupMember(id, newId)
              }
              const groupHref = studioGroupEditorPath(pathname, id)
              const groupMenuItems: DropdownMenuEntry[] = [
                {
                  label: t('studioSettings.services.groupMenuRename'),
                  icon: Pencil,
                  onClick: () => router.push(groupHref),
                },
                {
                  label: t('studioSettings.services.groupMenuAddService'),
                  icon: Plus,
                  onClick: quickAddServiceToGroup,
                },
                { separator: true },
                {
                  label: t('studioSettings.services.groupMenuMoveUp'),
                  icon: ArrowUp,
                  onClick: moveUp,
                  disabled: idx <= 0,
                },
                {
                  label: t('studioSettings.services.groupMenuMoveDown'),
                  icon: ArrowDown,
                  onClick: moveDown,
                  disabled: idx < 0 || idx >= groupIds.length - 1,
                },
                { separator: true },
                {
                  label: t('studioSettings.services.groupMenuDelete'),
                  icon: Trash2,
                  variant: 'destructive',
                  onClick: () => setRemoveGroupId(id),
                },
              ]
              return (
                <StudioSortableListCard
                  dragHandle={dragHandle}
                  href={groupHref}
                  menuTriggerAriaLabel={t('studioSettings.sortableListCardMenuAria')}
                  menuItems={groupMenuItems}
                  thumbnailUrl={studioDualBannerThumbnail(g.bannerDataUrl, g.bannerPortraitDataUrl)}
                  title={label}
                  description={descPreview.length > 0 ? descPreview : null}
                  chips={memberChips}
                  chipsSectionLabel={
                    memberChips.length > 0 ? t('studioSettings.services.groupCardServicesLabel') : null
                  }
                  chipsOverflowCount={moreMembers}
                  chipsOverflowLabel={
                    moreMembers > 0
                      ? t('studioSettings.services.groupCardMoreServices', { count: moreMembers })
                      : null
                  }
                  tagsFallback={
                    g.memberIds.length === 0 ? t('studioSettings.services.groupCardNoServices') : null
                  }
                />
              )
            }}
          </StudioSalesListLayout>
        )}

      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {view === 'full' ? (
        <StudioCollapsibleSectionsToolbar
          label={t('studioSettings.general.sectionsToolbarLabel')}
          minimal
          allExpanded={allSectionsExpanded}
          onToggleAll={() => setSectionsOpen(sectionOpenMap(SERVICES_HUB_KEYS, !allSectionsExpanded))}
          expandLabel={t('studioSettings.general.expandAllSections')}
          collapseLabel={t('studioSettings.general.collapseAllSections')}
        />
      ) : null}

      <div className={view === 'full' ? 'space-y-0.5' : undefined}>
      {showCatalog ? (
        view === 'full' ? (
          <StudioMinimalCollapsibleSection
            title={t('studioSettings.services.catalogTitle')}
            description={t('studioSettings.services.catalogBody')}
            open={isKeyOpen(sectionsOpen, 'catalog')}
            onToggle={() => toggleSection('catalog')}
          >
            {renderCatalogList()}
          </StudioMinimalCollapsibleSection>
        ) : (
          <StudioFlatSection
            title={t('studioSettings.services.catalogTitle')}
            description={t('studioSettings.services.catalogBody')}
          >
            {renderCatalogList()}
          </StudioFlatSection>
        )
      ) : null}

      {showGroups ? (
        view === 'full' ? (
          <StudioMinimalCollapsibleSection
            title={t('studioSettings.services.groupsTitle')}
            open={isKeyOpen(sectionsOpen, 'groups')}
            onToggle={() => toggleSection('groups')}
          >
            {renderGroupsList()}
          </StudioMinimalCollapsibleSection>
        ) : (
          renderGroupsList()
        )
      ) : null}
      </div>

      <ConfirmDialog
        open={removeCatalogId !== null}
        onClose={() => setRemoveCatalogId(null)}
        onConfirm={() => {
          if (removeCatalogId) removeCatalogItem(removeCatalogId)
          setRemoveCatalogId(null)
        }}
        title={t('studioSettings.services.confirmRemoveLineTitle')}
        message={t('studioSettings.services.confirmRemoveLineBody')}
        variant="destructive"
        confirmLabel={t('studioSettings.remove')}
      />

      <ConfirmDialog
        open={removeGroupId !== null}
        onClose={() => setRemoveGroupId(null)}
        onConfirm={() => {
          if (removeGroupId) removeServiceGroup(removeGroupId)
          setRemoveGroupId(null)
        }}
        title={t('studioSettings.services.confirmRemoveGroupTitle')}
        message={t('studioSettings.services.confirmRemoveGroupBody')}
        variant="destructive"
        confirmLabel={t('studioSettings.remove')}
      />
    </div>
  )
}
