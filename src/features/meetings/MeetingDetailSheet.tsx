'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  Check,
  ExternalLink,
  MoreVertical,
  RotateCcw,
  Video,
  X,
} from 'lucide-react'
import { Badge, Button, IconButton, Input, Label } from '@/components/atoms'
import { CrmStackedField, CrmStackedFieldList } from '@/components/molecules/CrmStackedField'
import { DropdownMenu } from '@/components/molecules/DropdownMenu'
import { Tooltip } from '@/components/molecules/Tooltip'
import { toast } from '@/components/molecules/Toast'
import { buildMeetingSheetMenuItems } from '@/features/meetings/lib/meetingSheetMenu'
import {
  formatCountdownSeconds,
  useMeetingCountdown,
} from '@/features/meetings/lib/meetingCountdown'
import { studioTintPanel } from '@/features/studio-settings/studioBlockChrome'
import {
  fromLocalDatetimeInput,
  toLocalDatetimeInput,
} from '@/features/meetings/lib/meetingFormUtils'
import { cn } from '@/lib/cn'
import {
  CRM_DETAIL_PANEL_ASIDE_CLASS,
  CRM_DETAIL_PANEL_MOBILE_SCRIM_CLASS,
} from '@/lib/ui/crmDetailPanelChrome'
import { formatDateTime } from '@/lib/intl/datetime'
import type { CalendarMeetingDTO, MeetingDTO } from '@/lib/meetings/schema'
import type { MeetingStatus } from '@/lib/db/schema/enums'

const DELETE_UNDO_MS = 10_000

interface MeetingDetailSheetProps {
  meeting: CalendarMeetingDTO
  locale: string
  onClose: () => void
  onUpdated?: (meeting: MeetingDTO) => void
  onDeleted?: () => void
  onRestored?: (meeting: MeetingDTO) => void
}

function statusBadgeVariant(status: MeetingStatus): 'default' | 'success' | 'error' {
  if (status === 'completed') return 'success'
  if (status === 'cancelled') return 'error'
  return 'default'
}

function formatDurationLabel(
  startsAt: string,
  endsAt: string | null,
  t: (key: string, opts?: { count?: number }) => string,
): string | null {
  if (!endsAt) return null
  const minutes = Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60_000)
  if (minutes <= 0) return null
  return t('calendar.sheet.fields.durationMinutes', { count: minutes })
}

function isJoinUrl(location: string | null): location is string {
  return Boolean(location?.trim().startsWith('http'))
}

async function patchMeeting(
  prospectId: string,
  meetingId: string,
  body: Record<string, unknown>,
): Promise<MeetingDTO | null> {
  const res = await fetch(`/api/prospects/${prospectId}/meetings/${meetingId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) return null
  const data = (await res.json()) as { meeting?: MeetingDTO }
  return data.meeting ?? null
}

type MeetingUndoSnapshot = {
  prospectId: string
  title: string
  startsAt: string
  endsAt: string | null
  location: string | null
  notes: string | null
  assigneeId: string
}

async function recreateMeeting(snapshot: MeetingUndoSnapshot): Promise<MeetingDTO | null> {
  const res = await fetch(`/api/prospects/${snapshot.prospectId}/meetings`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: snapshot.title,
      startsAt: snapshot.startsAt,
      endsAt: snapshot.endsAt,
      location: snapshot.location,
      notes: snapshot.notes,
      assigneeId: snapshot.assigneeId,
    }),
  })
  if (!res.ok) return null
  const data = (await res.json()) as { meeting?: MeetingDTO }
  return data.meeting ?? null
}

export function MeetingDetailSheet({
  meeting,
  locale,
  onClose,
  onUpdated,
  onDeleted,
  onRestored,
}: MeetingDetailSheetProps) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [startsAt, setStartsAt] = useState(() => toLocalDatetimeInput(meeting.startsAt))
  const [endsAt, setEndsAt] = useState(() =>
    meeting.endsAt ? toLocalDatetimeInput(meeting.endsAt) : '',
  )
  const [deleteBusy, setDeleteBusy] = useState(false)

  const isScheduled = meeting.status === 'scheduled'
  const joinUrl = isJoinUrl(meeting.location) ? meeting.location : null
  const duration = formatDurationLabel(meeting.startsAt, meeting.endsAt, t)
  const stageLabel = t(`prospects.stages.${meeting.prospectStage}`, {
    defaultValue: meeting.prospectStage,
  })

  async function applyPatch(
    body: Record<string, unknown>,
    toastKey: string,
  ): Promise<boolean> {
    setBusy(true)
    try {
      const updated = await patchMeeting(meeting.prospectId, meeting.id, body)
      if (!updated) {
        toast(t('meetings.errors.update_failed'), 'error')
        return false
      }
      onUpdated?.(updated)
      toast(t(toastKey), 'success')
      return true
    } finally {
      setBusy(false)
    }
  }

  async function handleComplete() {
    await applyPatch({ status: 'completed' }, 'meetings.toasts.completed')
  }

  async function handleCancel() {
    await applyPatch({ status: 'cancelled' }, 'meetings.toasts.cancelled')
  }

  async function handleReopen() {
    await applyPatch({ status: 'scheduled' }, 'meetings.toasts.reopened')
  }

  async function handleRescheduleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!startsAt.trim()) return
    const ok = await applyPatch(
      {
        startsAt: fromLocalDatetimeInput(startsAt),
        endsAt: endsAt.trim() ? fromLocalDatetimeInput(endsAt) : null,
        status: 'scheduled',
      },
      'meetings.toasts.rescheduled',
    )
    if (ok) setRescheduleOpen(false)
  }

  async function handleDelete() {
    const snapshot: MeetingUndoSnapshot = {
      prospectId: meeting.prospectId,
      title: meeting.title,
      startsAt: meeting.startsAt,
      endsAt: meeting.endsAt,
      location: meeting.location,
      notes: meeting.notes,
      assigneeId: meeting.assigneeId,
    }

    setDeleteBusy(true)
    try {
      const res = await fetch(`/api/prospects/${meeting.prospectId}/meetings/${meeting.id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        toast(t('meetings.errors.delete_failed'), 'error')
        return
      }

      onDeleted?.()
      onClose()

      toast(t('meetings.toasts.deleted'), 'success', {
        durationMs: DELETE_UNDO_MS,
        action: {
          label: t('common.undo'),
          onClick: () => {
            void (async () => {
              const restored = await recreateMeeting(snapshot)
              if (!restored) {
                toast(t('meetings.errors.restore_failed'), 'error')
                return
              }
              onRestored?.(restored)
              toast(t('meetings.toasts.restored'), 'success')
            })()
          },
        },
      })
    } finally {
      setDeleteBusy(false)
    }
  }

  function toggleReschedule() {
    setStartsAt(toLocalDatetimeInput(meeting.startsAt))
    setEndsAt(meeting.endsAt ? toLocalDatetimeInput(meeting.endsAt) : '')
    setRescheduleOpen((v) => !v)
  }

  const actionDisabled = busy || deleteBusy

  const menuItems = buildMeetingSheetMenuItems(t, isScheduled, {
    onReschedule: toggleReschedule,
    onCancel: () => void handleCancel(),
    onDelete: () => void handleDelete(),
    disabled: actionDisabled,
  })

  const countdown = useMeetingCountdown(meeting.startsAt, meeting.endsAt, meeting.status)

  const countdownLabel =
    countdown.phase === 'untilStart'
      ? t('calendar.sheet.countdown.untilStart')
      : countdown.phase === 'untilEnd'
        ? t('calendar.sheet.countdown.untilEnd')
        : countdown.phase === 'overdue'
          ? t('calendar.sheet.countdown.overdue')
          : null

  return (
    <>
      <button
        type="button"
        className={CRM_DETAIL_PANEL_MOBILE_SCRIM_CLASS}
        aria-label={t('common.close')}
        onClick={onClose}
      />
      <aside
        className={CRM_DETAIL_PANEL_ASIDE_CLASS}
        role="dialog"
        aria-modal="true"
        aria-label={meeting.title}
      >
      <header className="space-y-2.5 border-b border-border px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <span className="inline-flex shrink-0">
              <Badge variant={statusBadgeVariant(meeting.status)} size="sm">
                {t(`meetings.status.${meeting.status}`)}
              </Badge>
            </span>
            <h2 className="text-sm font-semibold leading-snug">{meeting.title}</h2>
          </div>
          <IconButton icon={X} size="sm" variant="ghost" label={t('common.close')} onClick={onClose} />
        </div>

        <div className={cn(studioTintPanel, 'flex items-center justify-between gap-3 px-2.5 py-2')}>
          <div className="min-w-0">
            {countdownLabel ? (
              <>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
                  {countdownLabel}
                </p>
                <p
                  className="font-mono text-lg font-semibold tabular-nums leading-none tracking-tight text-foreground"
                  aria-live="polite"
                >
                  {formatCountdownSeconds(countdown.seconds)}
                </p>
              </>
            ) : (
              <p className="text-xs text-muted">{t(`meetings.status.${meeting.status}`)}</p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-0.5" role="toolbar" aria-label={t('calendar.sheet.actionsTitle')}>
            {isScheduled ? (
              <Tooltip content={t('calendar.sheet.actions.complete')} position="bottom">
                <IconButton
                  icon={Check}
                  size="sm"
                  variant="secondary"
                  label={t('calendar.sheet.actions.complete')}
                  disabled={actionDisabled || busy}
                  onClick={() => void handleComplete()}
                />
              </Tooltip>
            ) : (
              <Tooltip content={t('calendar.sheet.actions.reopen')} position="bottom">
                <IconButton
                  icon={RotateCcw}
                  size="sm"
                  variant="secondary"
                  label={t('calendar.sheet.actions.reopen')}
                  disabled={actionDisabled || busy}
                  onClick={() => void handleReopen()}
                />
              </Tooltip>
            )}
            {joinUrl ? (
              <Tooltip content={t('calendar.sheet.actions.join')} position="bottom">
                <a
                  href={joinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    'survey-brand-control inline-flex h-8 w-8 items-center justify-center',
                    'border border-border bg-transparent text-foreground transition-colors hover:bg-hover',
                  )}
                  aria-label={t('calendar.sheet.actions.join')}
                >
                  <Video size={16} strokeWidth={1.5} />
                </a>
              </Tooltip>
            ) : null}
            <DropdownMenu
              align="right"
              items={menuItems}
              trigger={
                <IconButton
                  icon={MoreVertical}
                  size="sm"
                  variant="ghost"
                  label={t('calendar.sheet.moreActions')}
                  disabled={actionDisabled}
                  className="h-8 w-8"
                />
              }
            />
          </div>
        </div>
      </header>

      {rescheduleOpen ? (
        <form
          onSubmit={(e) => void handleRescheduleSubmit(e)}
          className="space-y-2 border-b border-border bg-foreground/[0.03] px-4 py-3 dark:bg-white/[0.04]"
        >
          <p className="text-xs font-medium text-foreground">{t('calendar.sheet.rescheduleTitle')}</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="sheet-meeting-starts" className="text-[10px] text-muted">
                {t('meetings.fields.startsAt')}
              </Label>
              <Input
                id="sheet-meeting-starts"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                disabled={busy}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sheet-meeting-ends" className="text-[10px] text-muted">
                {t('meetings.fields.endsAt')}
              </Label>
              <Input
                id="sheet-meeting-ends"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                disabled={busy}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <div className="flex justify-end gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => setRescheduleOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" size="sm" loading={busy} disabled={busy || !startsAt.trim()}>
              {t('calendar.sheet.saveReschedule')}
            </Button>
          </div>
        </form>
      ) : null}

      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-2 [scrollbar-gutter:stable]">
        <CrmStackedFieldList tinted={false} className="px-0">
          <CrmStackedField
            className="py-2.5"
            label={t('meetings.fields.prospect')}
            value={
              <Link
                href={`/prospects/${meeting.prospectId}`}
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                {meeting.prospectAccountName}
                <ExternalLink size={11} />
              </Link>
            }
          />
          <CrmStackedField className="py-2.5" label={t('calendar.sheet.fields.stage')} value={stageLabel} />
          {meeting.assigneeDisplayName ? (
            <CrmStackedField
              className="py-2.5"
              label={t('meetings.fields.assignee')}
              value={meeting.assigneeDisplayName}
            />
          ) : null}
          <CrmStackedField
            className="py-2.5"
            label={t('meetings.fields.startsAt')}
            value={formatDateTime(meeting.startsAt, locale)}
          />
          {meeting.endsAt ? (
            <CrmStackedField
              className="py-2.5"
              label={t('meetings.fields.endsAt')}
              value={formatDateTime(meeting.endsAt, locale)}
            />
          ) : null}
          {duration ? (
            <CrmStackedField
              className="py-2.5"
              label={t('calendar.sheet.fields.duration')}
              value={duration}
            />
          ) : null}
          <CrmStackedField
            className="py-2.5"
            label={t('calendar.sheet.status')}
            value={t(`meetings.status.${meeting.status}`)}
          />
          {meeting.location ? (
            <CrmStackedField
              className="py-2.5"
              label={t('meetings.fields.location')}
              value={
                joinUrl ? (
                  <a
                    href={joinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 break-all text-primary hover:underline"
                  >
                    {meeting.location}
                    <ExternalLink size={11} />
                  </a>
                ) : (
                  meeting.location
                )
              }
            />
          ) : null}
          {meeting.notes?.trim() ? (
            <CrmStackedField
              className="py-2.5"
              label={t('calendar.sheet.fields.notes')}
              value={<span className="whitespace-pre-wrap">{meeting.notes}</span>}
            />
          ) : null}
        </CrmStackedFieldList>
      </div>

      <footer className="mt-auto shrink-0 border-t border-border px-4 py-3">
        <Link
          href={`/prospects/${meeting.prospectId}`}
          className="inline-flex w-full items-center justify-between rounded-[var(--form-field-radius)] border border-border px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-hover"
        >
          <span>{t('calendar.sheet.openProspect')}</span>
          <ArrowRight size={14} aria-hidden />
        </Link>
      </footer>
    </aside>
    </>
  )
}
