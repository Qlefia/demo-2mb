'use client'

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CheckCircle2,
  Circle,
  CircleDashed,
  CircleSlash,
  Clock,
  Edit2,
  MoreVertical,
  Trash2,
  User,
} from 'lucide-react'
import { IconButton } from '@/components/atoms'
import { toast } from '@/components/molecules/Toast'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { DropdownMenu, type DropdownMenuEntry } from '@/components/molecules/DropdownMenu'
import { StudioAccentAddButton } from '@/features/studio-settings/components/StudioAccentAddButton'
import {
  studioRadiusNested,
  studioSortableListCard,
  studioTintPanel,
} from '@/features/studio-settings/studioBlockChrome'
import { cn } from '@/lib/cn'
import { formatDate, formatDateTime } from '@/lib/intl/datetime'
import type { AssignableOwner } from '@/lib/team/types'
import { TaskForm } from './TaskForm'
import { computeDueDate } from './dueDate'
import type { TaskDTO, TaskFormValues, TaskStatus } from './types'

interface TasksListProps {
  tasks: TaskDTO[]
  loading: boolean
  currentUserId: string | null
  isPrivilegedActor: boolean
  territory?: 'DE' | 'UK' | 'EU_other' | null
  owners?: AssignableOwner[]
  onCreate: (values: TaskFormValues) => Promise<TaskDTO | null>
  onUpdate: (id: string, patch: Partial<TaskFormValues> & { status?: TaskStatus }) => Promise<TaskDTO | null>
  onDelete: (id: string) => Promise<boolean>
}

const STATUS_ICONS: Record<TaskStatus, typeof Circle> = {
  open: Circle,
  in_progress: CircleDashed,
  done: CheckCircle2,
  cancelled: CircleSlash,
}

/**
 * Allowed status transitions per current status.
 * Keeps the row's transition buttons honest (Audit P1 #21) so users can't
 * jump open → done in one click; we still let cancelled/done go back to open.
 */
const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  open: ['in_progress', 'cancelled'],
  in_progress: ['done', 'cancelled'],
  done: ['open'],
  cancelled: ['open'],
}

const STATUS_ORDER: TaskStatus[] = ['open', 'in_progress', 'done', 'cancelled']

interface TaskRowProps {
  task: TaskDTO
  canEdit: boolean
  canDelete: boolean
  canTransition: boolean
  territory?: 'DE' | 'UK' | 'EU_other' | null
  assigneeName: string | null
  onUpdate: TasksListProps['onUpdate']
  onDelete: TasksListProps['onDelete']
}

function TaskRow({
  task,
  canEdit,
  canDelete,
  canTransition,
  territory,
  assigneeName,
  onUpdate,
  onDelete,
}: TaskRowProps) {
  const { t, i18n } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)

  const due = computeDueDate(task.dueAt)
  // Format the absolute fallback date with the current i18n locale so the
  // "due later" label doesn't leak browser locale into the UI.
  const dueValues = useMemo(() => {
    if (!due) return null
    if (due.labelKey === 'tasks.due.dueLater' && typeof due.values.date === 'string') {
      return { ...due.values, date: formatDate(due.values.date, i18n.language) }
    }
    return due.values
  }, [due, i18n.language])
  const StatusIcon = STATUS_ICONS[task.status]
  const isComplete = task.status === 'done' || task.status === 'cancelled'
  const allowedTransitions = ALLOWED_TRANSITIONS[task.status]

  const handleStatusChange = async (next: TaskStatus) => {
    if (next === task.status) return
    setBusy(true)
    try {
      const updated = await onUpdate(task.id, { status: next })
      if (updated) {
        toast(t(`tasks.toasts.status.${next}`), 'success')
      }
    } finally {
      setBusy(false)
    }
  }

  const handleSave = async (values: TaskFormValues) => {
    setBusy(true)
    try {
      const updated = await onUpdate(task.id, values)
      if (updated) {
        setEditing(false)
        toast(t('tasks.toasts.updated'), 'success')
      }
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    setBusy(true)
    try {
      const ok = await onDelete(task.id)
      if (ok) {
        setConfirmDelete(false)
        toast(t('tasks.toasts.deleted'), 'success')
      }
    } finally {
      setBusy(false)
    }
  }

  const menuItems: DropdownMenuEntry[] = []
  if (canEdit) {
    menuItems.push({ label: t('common.edit'), icon: Edit2, onClick: () => setEditing(true) })
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

  if (editing) {
    return (
      <li className={studioTintPanel}>
        <TaskForm
          initial={{ title: task.title, assigneeId: task.assigneeId, dueAt: task.dueAt }}
          territory={territory}
          submitting={busy}
          submitLabelKey="common.save"
          onSubmit={handleSave}
          onCancel={() => setEditing(false)}
        />
      </li>
    )
  }

  return (
    <li className={cn(studioSortableListCard, 'items-start gap-3')}>
      <button
        type="button"
        onClick={() => {
          if (!canTransition) return
          // Single-click status toggle uses the first allowed transition; the
          // chip row below exposes the full set.
          const next = allowedTransitions[0]
          if (next) void handleStatusChange(next)
        }}
        disabled={!canTransition || busy}
        aria-label={t(`tasks.status.${task.status}`)}
        className="mt-0.5 shrink-0 text-muted outline-none transition-colors hover:text-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        <StatusIcon size={18} />
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn('w-full text-sm font-medium', isComplete && 'text-muted line-through')}>
          {task.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1 uppercase tracking-wider">
            {t(`tasks.status.${task.status}`)}
          </span>
          {assigneeName && (
            <span className="inline-flex items-center gap-1">
              <User size={11} />
              {assigneeName}
            </span>
          )}
          {due && !isComplete && dueValues && (
            <span
              className={`inline-flex items-center gap-1 ${
                due.overdue ? 'text-destructive' : ''
              }`}
            >
              <Clock size={11} />
              {t(due.labelKey, dueValues)}
            </span>
          )}
          {task.completedAt && (
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 size={11} />
              {t('tasks.completedAt', { when: formatDateTime(task.completedAt, i18n.language) })}
            </span>
          )}
        </div>
        {canTransition && allowedTransitions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {allowedTransitions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleStatusChange(s)}
                disabled={busy}
                className={cn(
                  'inline-flex items-center gap-1 bg-foreground/6 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted transition-colors hover:bg-foreground/10 hover:text-foreground dark:bg-white/8',
                  studioRadiusNested,
                )}
              >
                {t(`tasks.actions.transition.${s}`)}
              </button>
            ))}
          </div>
        )}
      </div>

      {menuItems.length > 0 && (
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

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title={t('common.delete')}
        message={t('tasks.deleteConfirm')}
        variant="destructive"
        loading={busy}
      />
    </li>
  )
}

export function TasksList({
  tasks,
  loading,
  currentUserId,
  isPrivilegedActor,
  territory,
  owners,
  onCreate,
  onUpdate,
  onDelete,
}: TasksListProps) {
  const { t } = useTranslation()
  const [adding, setAdding] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const ownerById = useMemo(() => {
    const map = new Map<string, AssignableOwner>()
    for (const o of owners ?? []) map.set(o.id, o)
    return map
  }, [owners])

  const handleCreate = async (values: TaskFormValues) => {
    setSubmitting(true)
    try {
      const created = await onCreate(values)
      if (created) {
        setAdding(false)
        toast(t('tasks.toasts.created'), 'success')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">{t('common.loading')}</p>
  }

  const sorted = [...tasks].sort((a, b) => {
    const orderA = STATUS_ORDER.indexOf(a.status)
    const orderB = STATUS_ORDER.indexOf(b.status)
    if (orderA !== orderB) return orderA - orderB
    if (a.dueAt && b.dueAt) return a.dueAt.localeCompare(b.dueAt)
    if (a.dueAt) return -1
    if (b.dueAt) return 1
    return b.createdAt.localeCompare(a.createdAt)
  })

  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      {sorted.length === 0 && !adding && (
        <p className={cn(studioTintPanel, 'w-full text-xs text-muted')}>
          {t('tasks.empty')}
        </p>
      )}

      <ul className="grid w-full gap-2">
        {sorted.map((task) => {
          const isMine = task.assigneeId === currentUserId
          const canEdit = isPrivilegedActor
          const canDelete = isPrivilegedActor
          const canTransition = isPrivilegedActor || isMine
          const assigneeName = task.assigneeId
            ? ownerById.get(task.assigneeId)?.displayName ?? null
            : null
          return (
            <TaskRow
              key={task.id}
              task={task}
              canEdit={canEdit}
              canDelete={canDelete}
              canTransition={canTransition}
              territory={territory}
              assigneeName={assigneeName}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          )
        })}
      </ul>

      {isPrivilegedActor &&
        (adding ? (
          <div className={cn(studioTintPanel, 'w-full')}>
            <TaskForm
              territory={territory}
              submitting={submitting}
              submitLabelKey="tasks.actions.add"
              onSubmit={handleCreate}
              onCancel={() => setAdding(false)}
            />
          </div>
        ) : (
          <StudioAccentAddButton layout="block" onClick={() => setAdding(true)}>
            {t('tasks.actions.add')}
          </StudioAccentAddButton>
        ))}
    </div>
  )
}
