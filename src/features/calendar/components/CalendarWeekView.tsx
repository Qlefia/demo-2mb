'use client'

import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { CalendarEventChip } from '@/features/calendar/components/CalendarEventChip'
import { formatTime } from '@/lib/intl/datetime'
import {
  DAY_END_HOUR,
  DAY_START_HOUR,
  HOUR_HEIGHT_PX,
  addDays,
  isSameDay,
  meetingHeightPx,
  meetingTopPx,
  startOfWeek,
} from '@/lib/calendar/range'
import type { CalendarMeetingDTO } from '@/lib/meetings/schema'

interface CalendarWeekViewProps {
  anchor: Date
  meetings: CalendarMeetingDTO[]
  locale: string
  selectedMeetingId?: string | null
  onSlotClick?: (day: Date) => void
  onMeetingClick?: (meeting: CalendarMeetingDTO) => void
}

const GRID_HEIGHT = (DAY_END_HOUR - DAY_START_HOUR) * HOUR_HEIGHT_PX

export function CalendarWeekView({
  anchor,
  meetings,
  locale,
  selectedMeetingId,
  onSlotClick,
  onMeetingClick,
}: CalendarWeekViewProps) {
  const { t } = useTranslation()
  const weekStart = startOfWeek(anchor)
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const hours = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i)
  const today = new Date()

  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-[var(--form-field-radius)] border border-border">
      <div className="grid min-w-[720px] grid-cols-[3rem_repeat(7,minmax(0,1fr))] pb-4">
        <div className="border-b border-border bg-primary/2" />
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              'border-b border-l border-border px-2 py-2 text-center text-xs',
              isSameDay(day, today) && 'bg-primary/4 font-semibold',
            )}
          >
            <div className="text-muted">
              {new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(day)}
            </div>
            <div>{day.getDate()}</div>
          </div>
        ))}

        <div className="relative border-r border-border">
          {hours.map((hour) => (
            <div
              key={hour}
              className="border-b border-border pr-2 text-right text-[10px] text-muted"
              style={{ height: HOUR_HEIGHT_PX }}
            >
              {formatTime(new Date(2000, 0, 1, hour), locale)}
            </div>
          ))}
        </div>

        {days.map((day) => {
          const dayMeetings = meetings.filter(
            (m) => m.status === 'scheduled' && isSameDay(new Date(m.startsAt), day),
          )
          return (
            <div
              key={`col-${day.toISOString()}`}
              className="relative min-w-0 overflow-visible border-l border-border"
              style={{ height: GRID_HEIGHT }}
            >
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="border-b border-border/60"
                  style={{ height: HOUR_HEIGHT_PX }}
                />
              ))}
              <button
                type="button"
                className="absolute inset-0 z-0 cursor-pointer bg-transparent"
                aria-label={t('calendar.slotAria', {
                  date: new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(day),
                })}
                onClick={() => onSlotClick?.(day)}
              />
              {dayMeetings.map((m) => (
                <CalendarEventChip
                  key={m.id}
                  selected={selectedMeetingId === m.id}
                  className="absolute left-1 right-1 z-10 flex min-h-11 flex-col justify-start text-[10px] leading-snug"
                  style={{
                    top: meetingTopPx(m.startsAt),
                    height: meetingHeightPx(m),
                  }}
                  title={`${formatTime(m.startsAt, locale)} · ${m.title} · ${m.prospectAccountName}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onMeetingClick?.(m)
                  }}
                >
                  <span className="truncate font-medium">{m.title}</span>
                  <span className="truncate text-muted">{m.prospectAccountName}</span>
                </CalendarEventChip>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
