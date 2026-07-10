'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { PageLoadingCenter } from '@/components/atoms'
import { cn } from '@/lib/cn'
import { PAGE_FRAME_CLASS } from '@/lib/layout/pageFrame'
import { CalendarToolbar } from '@/features/calendar/components/CalendarToolbar'
import { CalendarWeekView } from '@/features/calendar/components/CalendarWeekView'
import { CalendarMonthView } from '@/features/calendar/components/CalendarMonthView'
import { useCalendarQuery } from '@/features/calendar/lib/useCalendarQuery'
import { MeetingCreateModal } from '@/features/meetings/MeetingCreateModal'
import { MeetingDetailSheet } from '@/features/meetings/MeetingDetailSheet'
import { refetchMeetingSurfaces } from '@/features/meetings/api/meetingsQueryKeys'
import {
  calendarMonthGridEnd,
  calendarMonthGridStart,
  toLocalDatetimeInputFromDay,
} from '@/lib/calendar/calendarPageUtils'
import { endOfWeek, startOfWeek } from '@/lib/calendar/range'
import type { CalendarMeetingDTO, CalendarScope, CalendarView } from '@/lib/meetings/schema'
import type { AssignableOwner } from '@/lib/team/types'
import { useUserStore } from '@/stores/userStore'
import { hasRole, OPS_PRIVILEGED_ROLES } from '@/lib/auth/roleGuards'

export function CalendarPage() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const role = useUserStore((s) => s.role)
  const userId = useUserStore((s) => s.user.id)

  const [anchor, setAnchor] = useState(() => new Date())
  const [view, setView] = useState<CalendarView>('week')
  const [scope, setScope] = useState<CalendarScope>('mine')
  const [teamMemberId, setTeamMemberId] = useState(userId)
  const [owners, setOwners] = useState<AssignableOwner[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [createStartsAt, setCreateStartsAt] = useState<string | null>(null)
  const [selectedMeeting, setSelectedMeeting] = useState<CalendarMeetingDTO | null>(null)

  const canFilterTeam = hasRole(role, OPS_PRIVILEGED_ROLES)

  useEffect(() => {
    if (!canFilterTeam) return
    let cancelled = false
    void fetch('/api/team/assignable-owners', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : { owners: [] }))
      .then((data: { owners?: AssignableOwner[] }) => {
        if (!cancelled) {
          const list = data.owners ?? []
          setOwners(list)
          if (!teamMemberId && list[0]) setTeamMemberId(list[0].id)
        }
      })
      .catch(() => {
        if (!cancelled) setOwners([])
      })
    return () => {
      cancelled = true
    }
  }, [canFilterTeam, teamMemberId])

  const range = useMemo(() => {
    if (view === 'week') {
      const from = startOfWeek(anchor)
      const to = endOfWeek(anchor)
      return { from: from.toISOString(), to: to.toISOString() }
    }
    const from = calendarMonthGridStart(anchor)
    const to = calendarMonthGridEnd(anchor)
    to.setHours(23, 59, 59, 999)
    return { from: from.toISOString(), to: to.toISOString() }
  }, [anchor, view])

  const queryParams = useMemo(
    () => ({
      from: range.from,
      to: range.to,
      scope,
      assigneeId: scope === 'team' ? teamMemberId : undefined,
      status: 'scheduled' as const,
    }),
    [range.from, range.to, scope, teamMemberId],
  )

  const query = useCalendarQuery(queryParams)
  const meetings = query.data?.items ?? []

  useEffect(() => {
    if (!selectedMeeting) return
    if (!meetings.some((m) => m.id === selectedMeeting.id)) {
      setSelectedMeeting(null)
    }
  }, [meetings, selectedMeeting])

  function openCreateForDay(day: Date) {
    setCreateStartsAt(toLocalDatetimeInputFromDay(day, 9))
    setCreateOpen(true)
  }

  function handleMeetingSelect(meeting: CalendarMeetingDTO) {
    setSelectedMeeting((prev) => (prev?.id === meeting.id ? null : meeting))
  }

  async function handleMeetingCreated(prospectId: string) {
    await refetchMeetingSurfaces(queryClient, prospectId)
  }

  return (
    <div className="flex h-full min-h-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className={cn(PAGE_FRAME_CLASS, 'shrink-0 bg-background pb-[var(--page-section-gap)] pt-[var(--page-section-gap)]')}>
          <h1 className="text-2xl font-semibold">{t('calendar.title')}</h1>
        </header>

        <div className={cn(PAGE_FRAME_CLASS, 'flex min-h-0 flex-1 flex-col gap-[var(--page-section-gap)] overflow-hidden')}>
          <CalendarToolbar
            anchor={anchor}
            view={view}
            scope={scope}
            teamMemberId={teamMemberId || userId}
            canFilterTeam={canFilterTeam}
            owners={owners}
            locale={i18n.language}
            onAnchorChange={setAnchor}
            onViewChange={setView}
            onScopeChange={setScope}
            onTeamMemberChange={setTeamMemberId}
            onCreateClick={() => {
              setCreateStartsAt(null)
              setCreateOpen(true)
            }}
          />

          {query.isLoading ? (
            <PageLoadingCenter />
          ) : query.isError ? (
            <p className="text-sm text-destructive">{t('calendar.errors.load_failed')}</p>
          ) : view === 'week' ? (
            <CalendarWeekView
              anchor={anchor}
              meetings={meetings}
              locale={i18n.language}
              selectedMeetingId={selectedMeeting?.id}
              onSlotClick={openCreateForDay}
              onMeetingClick={handleMeetingSelect}
            />
          ) : (
            <CalendarMonthView
              anchor={anchor}
              meetings={meetings}
              locale={i18n.language}
              selectedMeetingId={selectedMeeting?.id}
              onDayClick={openCreateForDay}
              onMeetingClick={handleMeetingSelect}
            />
          )}
        </div>
      </div>

      {selectedMeeting ? (
        <MeetingDetailSheet
          meeting={selectedMeeting}
          locale={i18n.language}
          onClose={() => setSelectedMeeting(null)}
          onUpdated={(updated) => {
            void refetchMeetingSurfaces(queryClient, updated.prospectId)
            setSelectedMeeting((prev) =>
              prev?.id === updated.id
                ? {
                    ...prev,
                    ...updated,
                    prospectAccountName: prev.prospectAccountName,
                    prospectStage: prev.prospectStage,
                    assigneeDisplayName: prev.assigneeDisplayName,
                  }
                : prev,
            )
          }}
          onDeleted={() => {
            void refetchMeetingSurfaces(queryClient, selectedMeeting.prospectId)
          }}
          onRestored={(restored) => {
            void refetchMeetingSurfaces(queryClient, restored.prospectId)
          }}
        />
      ) : null}

      <MeetingCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        initialStartsAt={createStartsAt}
        onCreated={(meeting) => void handleMeetingCreated(meeting.prospectId)}
      />
    </div>
  )
}
