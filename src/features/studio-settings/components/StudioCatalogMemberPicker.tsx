'use client'

import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { ArrowUpRight, MoreVertical, Pencil, Plus, UserMinus, UserPlus } from 'lucide-react'
import { Checkbox, IconButton, Input } from '@/components/atoms'
import { DropdownMenu, type DropdownMenuEntry, SearchInput } from '@/components/molecules'
import { SortableFieldRows } from '@/features/proposals/SortableFieldRows'
import {
  STUDIO_RELATION_RAIL_DESC_CHARS,
  STUDIO_SERVICE_CATALOG_LIMITS,
} from '@/features/studio-settings/constants'
import { catalogLinePatchForTitleChange } from '@/features/studio-settings/lib/catalogLineTitlePatch'
import {
  studioCatalogPickerRowId,
  useStudioCatalogPickerScroll,
} from '@/features/studio-settings/lib/useStudioCatalogPickerScroll'
import { stripHtmlToPlain } from '@/features/studio-settings/lib/stripHtmlToPlain'
import { StudioRelationListShell } from '@/features/studio-settings/components/StudioRelationListShell'
import { studioCatalogEditorPath } from '@/lib/studio/studioSalesPaths'
import {
  studioBlockStack,
  studioMemberRow,
  studioMemberRowRail,
  studioMemberRowRailSelected,
  studioMemberRowSelected,
  studioRadiusNested,
  studioRelationMemberList,
  studioSortableStack,
} from '@/features/studio-settings/studioBlockChrome'
import { useStudioProfileStore } from '@/stores/studioProfileStore'
import type { StudioServiceCatalogItem } from '@/stores/studioProfileTypes'
import { cn } from '@/lib/cn'

export type StudioCatalogPickerContext = 'group' | 'work' | 'segment'

export interface StudioCatalogMemberPickerProps {
  pickerBlockId: string
  context: StudioCatalogPickerContext
  selectedIds: readonly string[]
  onToggleSelected: (catalogLineId: string) => void
  canTurnOn?: (catalogLineId: string) => boolean
  onAddNewLine: (newCatalogLineId: string) => void
  emptyCatalogMessage?: string
  /** Proscus-style relations rail: left tabs, bordered scroll list, type tags. */
  layout?: 'default' | 'rail'
}

export function StudioCatalogMemberPicker({
  pickerBlockId,
  context,
  selectedIds,
  onToggleSelected,
  canTurnOn,
  onAddNewLine,
  emptyCatalogMessage,
  layout = 'default',
}: StudioCatalogMemberPickerProps) {
  const isRail = layout === 'rail'
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const serviceCatalog = useStudioProfileStore((s) => s.serviceCatalog)
  const addCatalogItem = useStudioProfileStore((s) => s.addCatalogItem)
  const updateCatalogItem = useStudioProfileStore((s) => s.updateCatalogItem)
  const reorderCatalog = useStudioProfileStore((s) => s.reorderCatalog)

  const [query, setQuery] = useState('')
  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const skipRenameCommitRef = useRef(false)

  const catalogIds = useMemo(() => serviceCatalog.map((c) => c.id), [serviceCatalog])
  const { scrollToCatalogRow } = useStudioCatalogPickerScroll(catalogIds)

  const q = query.trim().toLowerCase()
  const filterActive = q.length > 0
  const filteredCatalog = useMemo(() => {
    if (!q) return serviceCatalog
    return serviceCatalog.filter((c) => {
      const descPlain = stripHtmlToPlain(c.description, 2000).toLowerCase()
      return (
        c.title.toLowerCase().includes(q) ||
        descPlain.includes(q) ||
        c.summary.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
      )
    })
  }, [serviceCatalog, q])

  /** Checked rows first (newest selection at top), then the rest. */
  const displayCatalogIds = useMemo(() => {
    const poolIds = filterActive ? filteredCatalog.map((c) => c.id) : catalogIds
    const poolSet = new Set(poolIds)
    const selectedOrdered = selectedIds.filter((id) => poolSet.has(id))
    const selectedSet = new Set(selectedOrdered)
    const unselectedOrdered = poolIds.filter((id) => !selectedSet.has(id))
    return [...selectedOrdered, ...unselectedOrdered]
  }, [catalogIds, filterActive, filteredCatalog, selectedIds])

  const isSelected = useCallback((id: string) => selectedIds.includes(id), [selectedIds])

  const tryToggle = useCallback(
    (catalogLineId: string) => {
      if (isSelected(catalogLineId)) {
        onToggleSelected(catalogLineId)
        return
      }
      if (canTurnOn && !canTurnOn(catalogLineId)) return
      onToggleSelected(catalogLineId)
    },
    [canTurnOn, isSelected, onToggleSelected],
  )

  const addNewCatalogLine = () => {
    setQuery('')
    const newId = addCatalogItem()
    onAddNewLine(newId)
    setRenameId(newId)
    setRenameDraft('')
    scrollToCatalogRow(newId)
  }

  const startRename = (c: StudioServiceCatalogItem) => {
    setRenameId(c.id)
    setRenameDraft(c.title)
  }

  const commitRename = () => {
    if (!renameId) return
    const row = serviceCatalog.find((c) => c.id === renameId)
    if (!row) {
      setRenameId(null)
      return
    }
    const nextTitle = renameDraft.slice(0, STUDIO_SERVICE_CATALOG_LIMITS.title)
    updateCatalogItem(renameId, catalogLinePatchForTitleChange(row.title, nextTitle))
    setRenameId(null)
  }

  const memberCheckboxAria =
    context === 'group'
      ? (title: string) =>
          t('studioSettings.services.groupEditorMemberCheckboxAria', { title })
      : (title: string) => t('studioSettings.works.catalogMemberCheckboxAria', { title })

  const addMenuLabel =
    context === 'group'
      ? t('studioSettings.services.catalogMenuAddToGroup')
      : t('studioSettings.works.catalogMenuLinkToWork')

  const removeMenuLabel =
    context === 'group'
      ? t('studioSettings.services.catalogMenuRemoveFromGroup')
      : t('studioSettings.works.catalogMenuUnlinkFromWork')

  const catalogRowMenuItems = useCallback(
    (c: StudioServiceCatalogItem, selected: boolean, turnOnBlocked: boolean): DropdownMenuEntry[] => [
      {
        label: t('studioSettings.services.catalogMenuGoToService'),
        icon: ArrowUpRight,
        onClick: () => router.push(studioCatalogEditorPath(pathname, c.id)),
      },
      {
        label: t('studioSettings.services.catalogMenuRename'),
        icon: Pencil,
        onClick: () => startRename(c),
      },
      selected
        ? {
            label: removeMenuLabel,
            icon: UserMinus,
            onClick: () => tryToggle(c.id),
          }
        : {
            label: addMenuLabel,
            icon: UserPlus,
            onClick: () => tryToggle(c.id),
            disabled: turnOnBlocked,
          },
    ],
    [addMenuLabel, pathname, removeMenuLabel, router, t, tryToggle],
  )

  const renderCatalogRow = (c: StudioServiceCatalogItem, dragHandle: ReactNode | null) => {
    const selected = isSelected(c.id)
    const turnOnBlocked = !selected && canTurnOn !== undefined && !canTurnOn(c.id)
    const descT = stripHtmlToPlain(c.description, STUDIO_RELATION_RAIL_DESC_CHARS).trim()
    const lineTitle = c.title.trim() || t('studioSettings.services.unnamedLine')

    if (isRail) {
      return (
        <div
          id={studioCatalogPickerRowId(c.id)}
          className={cn(
            studioMemberRowRail,
            selected && studioMemberRowRailSelected,
            turnOnBlocked && 'opacity-60',
          )}
        >
          {dragHandle ? (
            <span className="flex shrink-0 items-center text-muted">{dragHandle}</span>
          ) : (
            <span className="flex h-6 w-5 shrink-0 items-center justify-center" aria-hidden />
          )}
          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={selected}
              disabled={turnOnBlocked}
              onChange={(next) => {
                if (next !== selected) tryToggle(c.id)
              }}
              ariaLabel={memberCheckboxAria(lineTitle)}
            />
          </div>
          <div className="flex min-h-0 min-w-0 flex-1 items-center gap-0.5">
              {renameId === c.id ? (
                <Input
                  className="min-h-8 min-w-0 flex-1"
                  value={renameDraft}
                  maxLength={STUDIO_SERVICE_CATALOG_LIMITS.title}
                  onChange={(e) => setRenameDraft(e.target.value)}
                  onBlur={() => {
                    if (skipRenameCommitRef.current) {
                      skipRenameCommitRef.current = false
                      return
                    }
                    commitRename()
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      commitRename()
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault()
                      skipRenameCommitRef.current = true
                      setRenameId(null)
                    }
                  }}
                  autoFocus
                  aria-label={t('studioSettings.services.catalogMenuRename')}
                />
              ) : (
                <button
                  type="button"
                  aria-pressed={selected}
                  disabled={turnOnBlocked}
                  onClick={() => tryToggle(c.id)}
                  onDoubleClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    startRename(c)
                  }}
                  className={cn(
                    'flex min-h-0 min-w-0 flex-1 flex-col justify-center px-1 py-0.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
                    studioRadiusNested,
                  )}
                >
                  <span className="block truncate text-[11px] font-semibold leading-snug text-foreground">
                    {lineTitle}
                  </span>
                  {descT ? (
                    <span className="mt-0.5 block truncate text-[10px] leading-tight text-muted">{descT}</span>
                  ) : null}
                </button>
              )}
          </div>
          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu
              align="right"
              trigger={
                <IconButton
                  icon={MoreVertical}
                  variant="ghost"
                  size="sm"
                  label={t('studioSettings.services.catalogRowActionsAria')}
                />
              }
              items={catalogRowMenuItems(c, selected, turnOnBlocked)}
            />
          </div>
        </div>
      )
    }

    return (
      <div
        id={studioCatalogPickerRowId(c.id)}
        className={cn(studioMemberRow, selected && studioMemberRowSelected)}
      >
        {dragHandle ? (
          <span className="shrink-0 text-muted">{dragHandle}</span>
        ) : (
          <span
            className={cn(
              'flex shrink-0 items-center justify-center',
              isRail ? 'h-6 w-5' : 'h-8 w-8',
            )}
            aria-hidden
          />
        )}
        <div className="shrink-0 self-center pt-0.5" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selected}
            disabled={turnOnBlocked}
            onChange={(next) => {
              if (next !== selected) tryToggle(c.id)
            }}
            ariaLabel={memberCheckboxAria(c.title.trim() || t('studioSettings.services.unnamedLine'))}
          />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-0.5">
          {renameId === c.id ? (
            <Input
              className="min-h-8 min-w-0 flex-1"
              value={renameDraft}
              maxLength={STUDIO_SERVICE_CATALOG_LIMITS.title}
              onChange={(e) => setRenameDraft(e.target.value)}
              onBlur={() => {
                if (skipRenameCommitRef.current) {
                  skipRenameCommitRef.current = false
                  return
                }
                commitRename()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  commitRename()
                }
                if (e.key === 'Escape') {
                  e.preventDefault()
                  skipRenameCommitRef.current = true
                  setRenameId(null)
                }
              }}
              autoFocus
              aria-label={t('studioSettings.services.catalogMenuRename')}
            />
          ) : (
            <button
              type="button"
              aria-pressed={selected}
              disabled={turnOnBlocked}
              onClick={() => tryToggle(c.id)}
              onDoubleClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                startRename(c)
              }}
              className={cn(
                'min-w-0 flex-1 px-1 py-0.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
                studioRadiusNested,
              )}
            >
              <span
                className={cn(
                  'block font-semibold leading-snug text-foreground',
                  isRail ? 'truncate text-[11px]' : 'text-sm',
                )}
              >
                {c.title || t('studioSettings.services.unnamedLine')}
              </span>
              {descT ? (
                <span className="mt-0.5 block truncate text-xs leading-snug text-muted">{descT}</span>
              ) : null}
            </button>
          )}
          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu
              align="right"
              trigger={
                <IconButton
                  icon={MoreVertical}
                  variant="ghost"
                  size="sm"
                  label={t('studioSettings.services.catalogRowActionsAria')}
                />
              }
              items={catalogRowMenuItems(c, selected, turnOnBlocked)}
            />
          </div>
        </div>
      </div>
    )
  }

  const emptyMessage =
    emptyCatalogMessage ??
    (context === 'work'
      ? t('studioSettings.works.linkedServicesEmptyCatalog')
      : context === 'segment'
        ? t('studioSettings.segments.linkedServicesEmptyCatalog')
        : t('studioSettings.services.catalogEmpty'))

  const searchToolbar = (
    <div className="flex items-center gap-1.5">
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder={t('studioSettings.services.searchCatalog')}
        className="min-w-0 flex-1"
        inputClassName={isRail ? 'h-8 text-xs' : undefined}
      />
      <IconButton
        icon={Plus}
        variant="secondary"
        size="sm"
        className={cn('shrink-0', isRail ? 'h-8 w-8' : 'h-9 w-9')}
        label={t('studioSettings.services.addLine')}
        onClick={addNewCatalogLine}
      />
    </div>
  )

  const renderCatalogList = () => {
    if (filteredCatalog.length === 0) {
      return <p className={cn('text-muted', isRail ? 'px-2 py-3 text-center text-[10px]' : 'text-sm')}>{t('studioSettings.services.catalogEmptyFiltered')}</p>
    }
    if (filterActive) {
      return (
        <div
          role="list"
          className={isRail ? studioRelationMemberList : undefined}
          aria-label={t('studioSettings.services.catalogListAria')}
        >
          {displayCatalogIds.map((id) => {
            const c = serviceCatalog.find((x) => x.id === id)
            if (!c) return null
            return (
              <div key={c.id} role="listitem">
                {renderCatalogRow(c, null)}
              </div>
            )
          })}
        </div>
      )
    }
    return (
      <SortableFieldRows
        blockId={pickerBlockId}
        itemIds={displayCatalogIds}
        onReorder={reorderCatalog}
        listLabel={t('studioSettings.services.catalogListAria')}
        alignStart
        containerClassName={isRail ? studioRelationMemberList : studioSortableStack}
      >
        {(id, dragHandle) => {
          const c = serviceCatalog.find((x) => x.id === id)
          if (!c) return null
          return renderCatalogRow(c, dragHandle)
        }}
      </SortableFieldRows>
    )
  }

  if (serviceCatalog.length === 0) {
    if (isRail) {
      return (
        <StudioRelationListShell toolbar={searchToolbar}>
          <p className="px-2 py-3 text-center text-[10px] text-muted">{emptyMessage}</p>
        </StudioRelationListShell>
      )
    }
    return (
      <div className={studioBlockStack}>
        {searchToolbar}
        <p className="text-sm text-muted">{emptyMessage}</p>
      </div>
    )
  }

  if (isRail) {
    return (
      <StudioRelationListShell selectedCount={selectedIds.length} toolbar={searchToolbar}>
        {renderCatalogList()}
      </StudioRelationListShell>
    )
  }

  return (
    <div className={studioBlockStack}>
      {searchToolbar}
      <div className="min-w-0">{renderCatalogList()}</div>
    </div>
  )
}
