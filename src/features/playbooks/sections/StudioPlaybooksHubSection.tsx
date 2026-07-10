'use client'

import { useCallback, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ClipboardCopy, Copy, Pencil, Trash2 } from 'lucide-react'
import type { DropdownMenuEntry } from '@/components/molecules'
import { ConfirmDialog, toast } from '@/components/molecules'
import { StudioSalesListLayout, StudioSortableListCard } from '@/features/studio-settings/components'
import { useStudioSalesListIds } from '@/features/studio-settings/lib/useStudioSalesListIds'
import type { StudioSalesListFilter } from '@/features/studio-settings/lib/studioSalesListTypes'
import {
  PLAYBOOK_KINDS,
  PLAYBOOK_LANGUAGES,
} from '@/lib/playbooks/schema'
import {
  deletePlaybook,
  duplicatePlaybook,
  fetchPlaybook,
  fetchPlaybooks,
  type PlaybookListItem,
} from '@/features/playbooks/lib/playbooksApi'
import { playbooksListQueryKey } from '@/features/playbooks/lib/playbookQueryKeys'
import { hasRole, OPS_PRIVILEGED_ROLES } from '@/lib/auth/roleGuards'
import { studioPlaybookEditorPath } from '@/lib/studio/studioSalesPaths'
import { useUserStore } from '@/stores/userStore'

const BLOCK = 'studio-playbooks'

function playbookById(items: PlaybookListItem[], id: string) {
  return items.find((pb) => pb.id === id)
}

function matchesPlaybookFilter(row: PlaybookListItem, filter: StudioSalesListFilter): boolean {
  if (filter === 'all') return true
  if ((PLAYBOOK_LANGUAGES as readonly string[]).includes(filter)) {
    return row.language === filter
  }
  if ((PLAYBOOK_KINDS as readonly string[]).includes(filter)) {
    return row.kind === filter
  }
  return true
}

export function StudioPlaybooksHubSection() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const role = useUserStore((s) => s.role)
  const canWrite = hasRole(role, OPS_PRIVILEGED_ROLES) || role === 'sales_de' || role === 'sales_uk'
  const canDelete = hasRole(role, OPS_PRIVILEGED_ROLES)

  const [removeId, setRemoveId] = useState<string | null>(null)

  const { data: playbooks = [], isLoading } = useQuery({
    queryKey: playbooksListQueryKey,
    queryFn: ({ signal }) => fetchPlaybooks(signal),
    staleTime: 30_000,
  })

  const playbookIds = playbooks.map((pb) => pb.id)
  const untitled = t('studioSettings.playbooks.untitled')

  const listState = useStudioSalesListIds({
    tab: 'playbooks',
    sourceIds: playbookIds,
    matchesFilter: useCallback(
      (id, filter: StudioSalesListFilter) => {
        const row = playbookById(playbooks, id)
        if (!row) return false
        return matchesPlaybookFilter(row, filter)
      },
      [playbooks],
    ),
    getSearchText: useCallback(
      (id) => {
        const row = playbookById(playbooks, id)
        if (!row) return ''
        return `${row.name} ${row.summary} ${row.language} ${row.kind} v${row.version} ${row.bodyPreview}`.trim()
      },
      [playbooks],
    ),
    getTitle: useCallback(
      (id) => {
        const row = playbookById(playbooks, id)
        return row?.name.trim() || untitled
      },
      [playbooks, untitled],
    ),
  })

  const handleDelete = async () => {
    if (!removeId) return
    try {
      await deletePlaybook(removeId)
      void queryClient.invalidateQueries({ queryKey: playbooksListQueryKey })
      toast(t('studioSettings.playbooks.deleted'), 'success')
    } catch {
      toast(t('error.somethingWentWrong'), 'error')
    } finally {
      setRemoveId(null)
    }
  }

  const copyScript = async (id: string) => {
    try {
      const detail = await fetchPlaybook(id)
      await navigator.clipboard.writeText(detail.body)
      toast(t('studioSettings.playbooks.copied'), 'success')
    } catch {
      toast(t('error.somethingWentWrong'), 'error')
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      const source = await fetchPlaybook(id)
      const created = await duplicatePlaybook(source)
      void queryClient.invalidateQueries({ queryKey: playbooksListQueryKey })
      router.push(studioPlaybookEditorPath(pathname, created.id))
      toast(t('studioSettings.playbooks.duplicated'), 'success')
    } catch {
      toast(t('error.somethingWentWrong'), 'error')
    }
  }

  const playbookMetaLabel = (row: PlaybookListItem) =>
    t('studioSettings.playbooks.menuMeta', {
      kind: t(`studioSettings.playbooks.kind.${row.kind}`),
      language: row.language.toUpperCase(),
      version: row.version,
    })

  if (isLoading) {
    return <p className="text-sm text-muted">{t('common.loading')}</p>
  }

  return (
    <div className="space-y-1">
      {playbookIds.length === 0 ? (
        <p className="text-sm text-muted">{t('studioSettings.playbooks.empty')}</p>
      ) : listState.noResults ? (
        <p className="text-sm text-muted">{t('studioSettings.sales.listToolbar.noResults')}</p>
      ) : (
        <StudioSalesListLayout
          blockId={BLOCK}
          itemIds={listState.ids}
          listLabel={t('studioSettings.playbooks.listAria')}
          viewMode={listState.viewMode === 'kanban' ? 'list' : listState.viewMode}
          isManualOrder={listState.isManualOrder}
          onReorder={() => {}}
        >
          {(id, dragHandle) => {
            const row = playbookById(playbooks, id)
            if (!row) return null
            const title = row.name.trim() || untitled
            const href = studioPlaybookEditorPath(pathname, id)
            const preview =
              row.summary.trim() ||
              row.bodyPreview.trim() ||
              t('studioSettings.playbooks.noBodyYet')

            const menuItems: DropdownMenuEntry[] = [
              {
                label: playbookMetaLabel(row),
                onClick: () => {},
                disabled: true,
              },
              { separator: true },
              {
                label: t('studioSettings.edit'),
                icon: Pencil,
                onClick: () => router.push(href),
              },
            ]
            if (canWrite) {
              menuItems.push({
                label: t('studioSettings.playbooks.duplicate'),
                icon: Copy,
                onClick: () => void handleDuplicate(id),
              })
            }
            menuItems.push({
              label: t('studioSettings.playbooks.copyScript'),
              icon: ClipboardCopy,
              onClick: () => void copyScript(id),
            })
            if (canDelete) {
              menuItems.push({ separator: true })
              menuItems.push({
                label: t('studioSettings.remove'),
                icon: Trash2,
                variant: 'destructive',
                onClick: () => setRemoveId(id),
              })
            }

            return (
              <StudioSortableListCard
                dragHandle={dragHandle}
                href={href}
                menuTriggerAriaLabel={t('studioSettings.sortableListCardMenuAria')}
                menuItems={menuItems}
                thumbnailUrl={null}
                title={title}
                description={preview}
              />
            )
          }}
        </StudioSalesListLayout>
      )}

      <ConfirmDialog
        open={removeId !== null}
        onClose={() => setRemoveId(null)}
        onConfirm={() => void handleDelete()}
        title={t('studioSettings.playbooks.confirmRemoveTitle')}
        message={t('studioSettings.playbooks.confirmRemoveBody')}
        variant="destructive"
        confirmLabel={t('studioSettings.remove')}
      />
    </div>
  )
}
