'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { Calendar, Check, Plus, Trash2, Video, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button, IconButton } from '@/components/atoms'
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog'
import { toast } from '@/components/molecules/Toast'
import { studioRadiusBlock, studioTintPanel } from '@/features/studio-settings/studioBlockChrome'
import { refetchMeetingSurfaces } from '@/features/meetings/api/meetingsQueryKeys'
import { useProspectMeetingsQuery } from '@/features/meetings/api/useProspectMeetingsQuery'
import { MeetingFormFields } from '@/features/meetings/MeetingFormFields'
import { MeetingCreateModal } from '@/features/meetings/MeetingCreateModal'
import {
  defaultEndsAtLocal,
  defaultStartsAtLocal,
  fromLocalDatetimeInput,
} from '@/features/meetings/lib/meetingFormUtils'
import { formatDateTime } from '@/lib/intl/datetime'
import type { MeetingDTO } from '@/lib/meetings/schema'
import { MEETING_STATUSES } from '@/lib/db/schema/enums'
import { useUserStore } from '@/stores/userStore'
import type { Prospect } from '@/features/prospects/types'

interface MeetingsPanelProps {
  prospect: Prospect
}

export function MeetingsPanel({ prospect }: MeetingsPanelProps) {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const userId = useUserStore((s) => s.user.id)
  const meetingsQuery = useProspectMeetingsQuery(prospect.id)
  const items = meetingsQuery.data ?? []

  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [startsAt, setStartsAt] = useState(defaultStartsAtLocal)
  const [endsAt, setEndsAt] = useState(defaultEndsAtLocal(defaultStartsAtLocal()))
  const [location, setLocation] = useState('')
  const [assigneeId, setAssigneeId] = useState(userId)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  async function refresh() {
    await refetchMeetingSurfaces(queryClient, prospect.id)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !assigneeId) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/prospects/${prospect.id}/meetings`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          startsAt: fromLocalDatetimeInput(startsAt),
          endsAt: fromLocalDatetimeInput(endsAt),
          location: location.trim() || null,
          assigneeId,
        }),
      })
      if (!res.ok) {
        toast(t('meetings.errors.create_failed'), 'error')
        return
      }
      setTitle('')
      setLocation('')
      setStartsAt(defaultStartsAtLocal())
      setEndsAt(defaultEndsAtLocal(defaultStartsAtLocal()))
      setShowForm(false)
      await refresh()
      toast(t('meetings.toasts.created'), 'success')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleStatusChange(meeting: MeetingDTO, status: (typeof MEETING_STATUSES)[number]) {
    const res = await fetch(`/api/prospects/${prospect.id}/meetings/${meeting.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) {
      toast(t('meetings.errors.update_failed'), 'error')
      return
    }
    await refresh()
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    setDeleteBusy(true)
    try {
      const res = await fetch(`/api/prospects/${prospect.id}/meetings/${pendingDelete}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        toast(t('meetings.errors.delete_failed'), 'error')
        return
      }
      setPendingDelete(null)
      await refresh()
    } finally {
      setDeleteBusy(false)
    }
  }

  const now = Date.now()
  const upcoming = items.filter(
    (m) => m.status === 'scheduled' && new Date(m.startsAt).getTime() >= now - 30 * 60 * 1000,
  )
  const past = items.filter((m) => !upcoming.includes(m))

  return (
    <section className={studioTintPanel}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">{t('prospects.workspace.meetingsTitle')}</h2>
          <p className="mt-1 text-xs text-muted">{t('meetings.hintProspect')}</p>
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={() => setModalOpen(true)}>
          <Plus size={14} className="mr-1" aria-hidden />
          {t('meetings.add')}
        </Button>
      </div>

      {showForm ? (
        <form onSubmit={handleAdd} className="mt-4 space-y-3 border-t border-border pt-4">
          <MeetingFormFields
            title={title}
            onTitleChange={setTitle}
            startsAt={startsAt}
            onStartsAtChange={(v) => {
              setStartsAt(v)
              setEndsAt(defaultEndsAtLocal(v))
            }}
            endsAt={endsAt}
            onEndsAtChange={setEndsAt}
            location={location}
            onLocationChange={setLocation}
            assigneeId={assigneeId}
            onAssigneeIdChange={setAssigneeId}
            territory={prospect.territory}
            disabled={submitting}
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting || !title.trim()}>
              {t('meetings.add')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      ) : (
        <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={() => setShowForm(true)}>
          {t('meetings.quickAdd')}
        </Button>
      )}

      {meetingsQuery.isLoading ? (
        <p className="mt-4 text-sm text-muted">{t('common.loading')}</p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{t('meetings.empty')}</p>
      ) : (
        <MeetingLists
          upcoming={upcoming}
          past={past}
          locale={i18n.language}
          onComplete={(m) => void handleStatusChange(m, 'completed')}
          onCancel={(m) => void handleStatusChange(m, 'cancelled')}
          onDelete={setPendingDelete}
        />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title={t('meetings.deleteConfirmTitle')}
        message={t('meetings.deleteConfirmBody')}
        confirmLabel={t('common.delete')}
        onConfirm={() => void confirmDelete()}
        loading={deleteBusy}
        variant="destructive"
      />

      <MeetingCreateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        prospectId={prospect.id}
        onCreated={() => void refresh()}
      />
    </section>
  )
}

function MeetingLists({
  upcoming,
  past,
  locale,
  onComplete,
  onCancel,
  onDelete,
}: {
  upcoming: MeetingDTO[]
  past: MeetingDTO[]
  locale: string
  onComplete: (m: MeetingDTO) => void
  onCancel: (m: MeetingDTO) => void
  onDelete: (id: string) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="mt-4 space-y-4">
      {upcoming.length > 0 ? (
        <MeetingGroup
          label={t('meetings.upcoming')}
          meetings={upcoming}
          locale={locale}
          onComplete={onComplete}
          onCancel={onCancel}
          onDelete={onDelete}
        />
      ) : null}
      {past.length > 0 ? (
        <MeetingGroup
          label={t('meetings.past')}
          meetings={past}
          locale={locale}
          muted
          onComplete={onComplete}
          onCancel={onCancel}
          onDelete={onDelete}
        />
      ) : null}
    </div>
  )
}

function MeetingGroup({
  label,
  meetings,
  locale,
  muted = false,
  onComplete,
  onCancel,
  onDelete,
}: {
  label: string
  meetings: MeetingDTO[]
  locale: string
  muted?: boolean
  onComplete: (m: MeetingDTO) => void
  onCancel: (m: MeetingDTO) => void
  onDelete: (id: string) => void
}) {
  const { t } = useTranslation()

  return (
    <div>
      <p className="crm-meta-label mb-2">{label}</p>
      <ul className="space-y-2">
        {meetings.map((meeting) => (
          <li
            key={meeting.id}
            className={cn(
              studioRadiusBlock,
              'flex flex-wrap items-start justify-between gap-2 p-3',
              muted ? 'bg-foreground/3 dark:bg-white/3' : 'bg-foreground/4 dark:bg-white/5',
            )}
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Calendar size={14} className="shrink-0 text-muted" aria-hidden />
                <span className={cn('text-sm font-medium', meeting.status !== 'scheduled' && 'text-muted line-through')}>
                  {meeting.title}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-muted">
                  {t(`meetings.status.${meeting.status}`)}
                </span>
              </div>
              <p className="text-xs text-muted">{formatDateTime(meeting.startsAt, locale)}</p>
              {meeting.location ? (
                <p className="flex items-center gap-1 text-xs text-muted">
                  <Video size={12} aria-hidden />
                  {meeting.location.startsWith('http') ? (
                    <a href={meeting.location} target="_blank" rel="noreferrer" className="truncate text-primary hover:underline">
                      {meeting.location}
                    </a>
                  ) : (
                    <span className="truncate">{meeting.location}</span>
                  )}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              {meeting.status === 'scheduled' ? (
                <>
                  <IconButton type="button" size="sm" icon={Check} label={t('meetings.markCompleted')} onClick={() => onComplete(meeting)} />
                  <IconButton type="button" size="sm" icon={X} label={t('meetings.markCancelled')} onClick={() => onCancel(meeting)} />
                </>
              ) : null}
              <IconButton type="button" size="sm" icon={Trash2} label={t('common.delete')} onClick={() => onDelete(meeting.id)} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
