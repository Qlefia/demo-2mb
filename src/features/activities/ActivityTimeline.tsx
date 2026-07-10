'use client'

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowRightLeft,
  CheckSquare,
  CircleSlash,
  Copy,
  Edit2,
  FileText,
  Linkedin,
  Mail,
  MoreVertical,
  NotebookPen,
  Phone,
  RotateCcw,
  Settings2,
  Shield,
  Trash2,
  Users,
} from 'lucide-react'
import { Button, IconButton, TextArea } from '@/components/atoms'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { DropdownMenu, type DropdownMenuEntry } from '@/components/molecules/DropdownMenu'
import { toast } from '@/components/molecules/Toast'
import { cn } from '@/lib/cn'
import { USER_ACTIVITY_TYPES } from '@/lib/activities/schema'
import type { ActivityType, ProspectStage } from '@/lib/db/schema/enums'
import { formatDayHeader, formatTime } from '@/lib/intl/datetime'
import { STAGE_META_BY_ID } from '@/features/prospects/stageMeta'
import {
  studioRadiusBlock,
  studioRadiusNested,
  studioSegmentedControl,
  studioSegmentedControlTab,
  studioTintPanel,
} from '@/features/studio-settings/studioBlockChrome'
import type { ActivityDTO } from './types'

interface ActivityTimelineProps {
  activities: ActivityDTO[]
  loading: boolean
  currentUserId: string | null
  isPrivilegedActor: boolean
  onUpdate: (id: string, summary: string) => Promise<boolean>
  onDelete: (id: string) => Promise<boolean>
}

type FilterMode = 'all' | 'user' | 'system'

const ACTIVITY_ICONS: Record<ActivityType, typeof Mail> = {
  note: NotebookPen,
  call: Phone,
  email: Mail,
  linkedin: Linkedin,
  stage_change: ArrowRightLeft,
  owner_change: Users,
  audit: Shield,
  dossier_delivered: FileText,
  task_completed: CheckSquare,
  opt_out: CircleSlash,
}

function formatDayKey(iso: string): string {
  return iso.slice(0, 10)
}

function getSummary(a: ActivityDTO): string {
  const payload = a.payload as Record<string, unknown>
  const summary = typeof payload.summary === 'string' ? payload.summary : ''
  return summary
}

interface ActivityItemProps {
  activity: ActivityDTO
  canEdit: boolean
  canDelete: boolean
  onUpdate: (id: string, summary: string) => Promise<boolean>
  onDelete: (id: string) => Promise<boolean>
}

function stageLabel(slug: string, t: ReturnType<typeof useTranslation>['t']): string {
  if (!slug) return '?'
  const meta = STAGE_META_BY_ID[slug as ProspectStage]
  return meta ? t(meta.labelKey) : slug
}

function ActivityItem({ activity, canEdit, canDelete, onUpdate, onDelete }: ActivityItemProps) {
  const { t, i18n } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [draft, setDraft] = useState(getSummary(activity))
  const [busy, setBusy] = useState(false)

  const isReopen =
    activity.type === 'note' &&
    activity.isSystem &&
    (activity.payload as Record<string, unknown>)?.kind === 'dossier_reopened'
  const Icon = isReopen
    ? RotateCcw
    : (ACTIVITY_ICONS[activity.type] ?? Settings2)
  const summary = getSummary(activity)
  const time = formatTime(activity.createdAt, i18n.language)

  const payload = activity.payload as Record<string, unknown>
  const meta: string[] = []
  if (activity.type === 'call' && typeof payload.durationMinutes === 'number') {
    meta.push(t('activities.meta.duration', { minutes: payload.durationMinutes }))
  }
  if (activity.type === 'email' && typeof payload.subject === 'string' && payload.subject.trim()) {
    meta.push(t('activities.meta.subject', { subject: payload.subject }))
  }
  if (activity.type === 'linkedin' && typeof payload.url === 'string' && payload.url.trim()) {
    meta.push(t('activities.meta.url'))
  }
  if (activity.type === 'stage_change') {
    // The audit trigger writes payload as `{ stage: { from, to } }`; older
    // payloads (manual inserts in tests) used a flat `{ from, to }` shape.
    const stagePatch = (payload.stage ?? null) as Record<string, unknown> | null
    const fromRaw = typeof stagePatch?.from === 'string'
      ? (stagePatch.from as string)
      : typeof payload.from === 'string'
        ? payload.from
        : ''
    const toRaw = typeof stagePatch?.to === 'string'
      ? (stagePatch.to as string)
      : typeof payload.to === 'string'
        ? payload.to
        : ''
    const from = stageLabel(fromRaw, t)
    const to = stageLabel(toRaw, t)
    meta.push(t('activities.meta.stage', { from, to }))
  }
  if (activity.type === 'owner_change') {
    meta.push(t('activities.meta.ownerChanged'))
  }
  if (activity.type === 'audit') {
    const changed = Object.keys(payload).filter(
      (k) => !['system', 'kind', 'summary'].includes(k),
    )
    if (changed.length > 0) {
      meta.push(t('activities.meta.auditChanged', { fields: changed.join(', ') }))
    }
  }
  if (activity.type === 'dossier_delivered') {
    const version = payload.version
    if (typeof version === 'number') meta.push(t('activities.meta.version', { version }))
  }
  if (activity.type === 'task_completed') {
    const title = typeof payload.title === 'string' ? payload.title : ''
    if (title) meta.push(title)
  }
  if (
    activity.type === 'note' &&
    activity.isSystem &&
    typeof payload.kind === 'string' &&
    payload.kind === 'dossier_reopened'
  ) {
    const fromVersion = payload.fromVersion
    if (typeof fromVersion === 'number') {
      meta.push(t('activities.meta.dossierReopened', { version: fromVersion }))
    } else {
      meta.push(t('activities.meta.dossierReopenedNoVersion'))
    }
  }

  const handleSave = async () => {
    if (!draft.trim()) return
    setBusy(true)
    try {
      const ok = await onUpdate(activity.id, draft.trim())
      if (ok) setEditing(false)
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    setBusy(true)
    try {
      const ok = await onDelete(activity.id)
      if (ok) setConfirmDelete(false)
    } finally {
      setBusy(false)
    }
  }

  const menuItems: DropdownMenuEntry[] = []
  if (canEdit) {
    menuItems.push({ label: t('common.edit'), icon: Edit2, onClick: () => setEditing(true) })
  }
  if (summary) {
    menuItems.push({
      label: t('common.copy'),
      icon: Copy,
      onClick: () => {
        void navigator.clipboard
          .writeText(summary)
          .then(() => toast(t('prospects.workspace.copied'), 'success'))
          .catch(() => toast(t('prospects.workspace.copyFailed'), 'error'))
      },
    })
  }
  if (canDelete) {
    if (menuItems.length > 0) menuItems.push({ separator: true })
    menuItems.push({
      label: t('common.delete'),
      icon: Trash2,
      onClick: () => setConfirmDelete(true),
      variant: 'destructive',
    })
  }

  return (
    <li className={cn(studioRadiusBlock, 'flex gap-3 bg-foreground/4 p-3 dark:bg-white/5')}>
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center',
          studioRadiusNested,
          activity.isSystem ? 'bg-foreground/8 text-muted dark:bg-white/10' : 'bg-primary/10 text-foreground',
        )}
      >
        <Icon size={13} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-medium uppercase tracking-wider text-muted">
              {isReopen
                ? t('activities.types.dossier_reopened')
                : t(`activities.types.${activity.type}`)}
            </span>
            {activity.isSystem && (
              <span className={cn('inline-flex items-center gap-1 bg-foreground/8 px-1.5 py-px text-[10px] uppercase text-muted dark:bg-white/10', studioRadiusNested)}>
                {t('activities.systemBadge')}
              </span>
            )}
          </div>
          <span className="text-[11px] text-muted">{time}</span>
        </div>

        {meta.length > 0 && (
          <p className="mt-0.5 text-[11px] text-muted">{meta.join(' · ')}</p>
        )}

        {editing ? (
          <div className="mt-2 space-y-2">
            <TextArea
              rows={3}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={busy}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditing(false)
                  setDraft(summary)
                }}
                disabled={busy}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                loading={busy}
                disabled={!draft.trim() || draft.trim() === summary.trim()}
              >
                {t('common.save')}
              </Button>
            </div>
          </div>
        ) : (
          summary && <p className="mt-1.5 whitespace-pre-wrap text-sm">{summary}</p>
        )}

        {activity.type === 'linkedin' &&
          typeof payload.url === 'string' &&
          payload.url.trim() && (
            <a
              href={payload.url}
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted hover:text-foreground"
            >
              <Linkedin size={11} /> {payload.url}
            </a>
          )}

        <ConfirmDialog
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          onConfirm={handleDelete}
          title={t('common.delete')}
          message={t('activities.deleteConfirm')}
          variant="destructive"
          loading={busy}
        />
      </div>

      {(canEdit || canDelete) && !editing && menuItems.length > 0 && (
        <DropdownMenu
          align="right"
          trigger={
            <IconButton
              icon={MoreVertical}
              variant="ghost"
              size="sm"
              label={t('common.actions')}
              disabled={busy}
            />
          }
          items={menuItems}
        />
      )}
    </li>
  )
}

export function ActivityTimeline({
  activities,
  loading,
  currentUserId,
  isPrivilegedActor,
  onUpdate,
  onDelete,
}: ActivityTimelineProps) {
  const { t, i18n } = useTranslation()
  const [filter, setFilter] = useState<FilterMode>('all')

  const filtered = useMemo(() => {
    if (filter === 'user') return activities.filter((a) => !a.isSystem)
    if (filter === 'system') return activities.filter((a) => a.isSystem)
    return activities
  }, [activities, filter])

  const grouped = useMemo(() => {
    const map = new Map<string, ActivityDTO[]>()
    for (const a of filtered) {
      const key = formatDayKey(a.createdAt)
      const arr = map.get(key) ?? []
      arr.push(a)
      map.set(key, arr)
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filtered])

  if (loading) {
    return <p className="text-sm text-muted">{t('common.loading')}</p>
  }

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className={studioSegmentedControl} role="group" aria-label={t('activities.filterGroupLabel')}>
          {(['all', 'user', 'system'] as FilterMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFilter(mode)}
              aria-pressed={filter === mode}
              className={cn(
                studioSegmentedControlTab,
                filter === mode
                  ? 'bg-foreground text-background'
                  : 'text-muted hover:bg-foreground/10 hover:text-foreground',
              )}
            >
              {t(`activities.filters.${mode}`)}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[11px] text-muted">
          {t('activities.countLabel', { count: filtered.length })}
        </span>
      </div>

      {grouped.length === 0 && (
        <p className={cn(studioTintPanel, 'text-xs text-muted')}>{t('activities.empty')}</p>
      )}

      <div className="space-y-5">
        {grouped.map(([day, items]) => (
          <section key={day}>
            <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted">
              {formatDayHeader(day, i18n.language)}
            </h3>
            <ul className="space-y-2">
              {items.map((a) => {
                const isMine = a.actorId !== null && a.actorId === currentUserId
                const canEdit = !a.isSystem && (isPrivilegedActor || isMine)
                const canDelete = canEdit
                return (
                  <ActivityItem
                    key={a.id}
                    activity={a}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                  />
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

export const ACTIVITY_USER_TYPES = USER_ACTIVITY_TYPES
