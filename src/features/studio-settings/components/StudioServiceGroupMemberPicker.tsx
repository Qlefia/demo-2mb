'use client'

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/atoms'
import { SearchInput } from '@/components/molecules'
import { STUDIO_RELATION_RAIL_DESC_CHARS } from '@/features/studio-settings/constants'
import { StudioRelationListShell } from '@/features/studio-settings/components/StudioRelationListShell'
import { isLinkedToCatalogBundle } from '@/features/studio-settings/lib/studioGroupWorks'
import { stripHtmlToPlain } from '@/features/studio-settings/lib/stripHtmlToPlain'
import {
  studioMemberRowRail,
  studioMemberRowRailSelected,
  studioRadiusNested,
  studioRelationMemberList,
} from '@/features/studio-settings/studioBlockChrome'
import { getStudioServiceGroupTitle, useStudioProfileStore } from '@/stores/studioProfileStore'
import type { StudioServiceGroup } from '@/stores/studioProfileTypes'
import { cn } from '@/lib/cn'

/**
 * Two selection modes:
 *  - `work` (default) — selection is derived from the host's `linkedCatalogIds`;
 *    a group is "on" when every one of its `memberIds` is linked. Empty groups
 *    are disabled because they can never satisfy the bundle check.
 *  - `direct` — selection comes straight from `selectedGroupIds`. The host
 *    decides what "on" means (e.g. Tool ↔ Group direct link via
 *    `serviceGroup.linkedToolIds`), so empty groups are NOT disabled and the
 *    bundle helper is bypassed.
 */
export type StudioServiceGroupMemberPickerProps =
  | {
      mode?: 'work'
      linkedCatalogIds: readonly string[]
      onToggleGroup: (groupId: string) => void
      canToggleGroup?: (groupId: string) => boolean
    }
  | {
      mode: 'direct'
      selectedGroupIds: readonly string[]
      onToggleGroup: (groupId: string) => void
    }

function memberLineLabels(
  group: StudioServiceGroup,
  catalogById: Map<string, string>,
  untitledLine: string,
): string {
  return group.memberIds
    .map((id) => catalogById.get(id)?.trim() || untitledLine)
    .filter(Boolean)
    .join(' · ')
}

export function StudioServiceGroupMemberPicker(props: StudioServiceGroupMemberPickerProps) {
  const direct = props.mode === 'direct'
  const onToggleGroup = props.onToggleGroup
  const linkedCatalogIds = direct ? null : props.linkedCatalogIds
  const selectedGroupIds = direct ? props.selectedGroupIds : null
  const canToggleGroup = direct ? undefined : props.canToggleGroup

  const { t } = useTranslation()
  const serviceGroups = useStudioProfileStore((s) => s.serviceGroups)
  const serviceCatalog = useStudioProfileStore((s) => s.serviceCatalog)

  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const untitledGroup = t('studioSettings.services.untitledGroup')
  const untitledLine = t('studioSettings.services.unnamedLine')

  const catalogById = useMemo(
    () => new Map(serviceCatalog.map((c) => [c.id, c.title])),
    [serviceCatalog],
  )

  const filteredGroups = useMemo(() => {
    if (!q) return serviceGroups
    return serviceGroups.filter((g) => {
      const title = getStudioServiceGroupTitle(serviceGroups, g.id, untitledGroup).toLowerCase()
      const members = memberLineLabels(g, catalogById, untitledLine).toLowerCase()
      return title.includes(q) || members.includes(q)
    })
  }, [catalogById, q, serviceGroups, untitledGroup, untitledLine])

  const isSelected = (group: StudioServiceGroup) =>
    direct
      ? (selectedGroupIds ?? []).includes(group.id)
      : isLinkedToCatalogBundle(linkedCatalogIds ?? [], group.memberIds)

  const selectedCount = useMemo(
    () => serviceGroups.filter((g) => isSelected(g)).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [serviceGroups, linkedCatalogIds, selectedGroupIds],
  )

  const searchToolbar = (
    <SearchInput
      value={query}
      onChange={setQuery}
      placeholder={t('studioSettings.services.searchGroups')}
      className="min-w-0"
      inputClassName="h-8 text-xs"
    />
  )

  return (
    <StudioRelationListShell selectedCount={selectedCount} toolbar={searchToolbar}>
      {serviceGroups.length === 0 ? (
        <p className="px-2 py-3 text-center text-[10px] text-muted">
          {t('studioSettings.services.groupsEmpty')}
        </p>
      ) : filteredGroups.length === 0 ? (
        <p className="px-2 py-3 text-center text-[10px] text-muted">
          {t('studioSettings.services.groupsEmptyFiltered')}
        </p>
      ) : (
        <ul className={studioRelationMemberList} aria-label={t('studioSettings.services.groupsListAria')}>
          {filteredGroups.map((g) => {
            const selected = isSelected(g)
            const turnOnBlocked = !selected && canToggleGroup !== undefined && !canToggleGroup(g.id)
            const title = getStudioServiceGroupTitle(serviceGroups, g.id, untitledGroup)
            const descT = stripHtmlToPlain(g.description, STUDIO_RELATION_RAIL_DESC_CHARS).trim()

            return (
              <li key={g.id}>
                <div
                  className={cn(
                    studioMemberRowRail,
                    selected && studioMemberRowRailSelected,
                    turnOnBlocked && 'opacity-60',
                  )}
                >
                  <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selected}
                      disabled={turnOnBlocked || (!direct && g.memberIds.length === 0)}
                      onChange={(next) => {
                        if (next !== selected) onToggleGroup(g.id)
                      }}
                      ariaLabel={t('studioSettings.works.groupMemberCheckboxAria', { title })}
                    />
                  </div>
                  <button
                    type="button"
                    aria-pressed={selected}
                    disabled={turnOnBlocked || (!direct && g.memberIds.length === 0)}
                    onClick={() => onToggleGroup(g.id)}
                    className={cn(
                      'flex min-h-0 min-w-0 flex-1 flex-col justify-center px-1 py-0.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
                      studioRadiusNested,
                    )}
                  >
                    <span className="block truncate text-[11px] font-semibold leading-snug text-foreground">
                      {title}
                    </span>
                    {descT ? (
                      <span className="mt-0.5 block truncate text-[10px] leading-tight text-muted">{descT}</span>
                    ) : null}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </StudioRelationListShell>
  )
}
