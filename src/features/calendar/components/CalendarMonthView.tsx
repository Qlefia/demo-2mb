'use client'

import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { CalendarEventChip } from '@/features/calendar/components/CalendarEventChip'
import { formatTime } from '@/lib/intl/datetime'
import {
  addDays,
  calendarMonthGridEnd,
  calendarMonthGridStart,
  isSameDay,
} from '@/lib/calendar/range'
import type { CalendarMeetingDTO } from '@/lib/meetings/schema'

interface CalendarMonthViewProps {
  anchor: Date
  meetings: CalendarMeetingDTO[]
  locale: string
  selectedMeetingId?: string | null
  onDayClick?: (day: Date) => void
  onMeetingClick?: (meeting: CalendarMeetingDTO) => void
}

export function CalendarMonthView({
  anchor,
  meetings,
  locale,
  selectedMeetingId,
  onDayClick,
  onMeetingClick,
}: CalendarMonthViewProps) {
  const { t } = useTranslation()
  const gridStart = calendarMonthGridStart(anchor)
  const gridEnd = calendarMonthGridEnd(anchor)
  const today = new Date()
  const monthIndex = anchor.getMonth()

  const days: Date[] = []
  for (let d = new Date(gridStart); d <= gridEnd; d = addDays(d, 1)) {
    days.push(new Date(d))
  }

  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  const weekdayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(startOfWeekMonday(new Date()), i)
    return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d)
  })

  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-[var(--form-field-radius)] border border-border">
      <div className="grid grid-cols-7 border-b border-border bg-primary/2 text-center text-xs text-muted">
        {weekdayLabels.map((label) => (
          <div key={label} className="px-1 py-2 font-medium">
            {label}
          </div>
        ))}
      </div>
      {weeks.map((week) => (
        <div key={week[0].toISOString()} className="grid grid-cols-7">
          {week.map((day) => {
            const inMonth = day.getMonth() === monthIndex
            const dayMeetings = meetings
              .filter((m) => m.status === 'scheduled' && isSameDay(new Date(m.startsAt), day))
              .slice(0, 3)
            const overflow = meetings.filter(
              (m) => m.status === 'scheduled' && isSameDay(new Date(m.startsAt), day),
            ).length - dayMeetings.length

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'min-h-[88px] border-b border-r border-border p-1',
                  !inMonth && 'bg-primary/2 text-muted',
                  isSameDay(day, today) && 'bg-primary/4',
                )}
              >
                <button
                  type="button"
                  onClick={() => onDayClick?.(day)}
                  className="mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs hover:bg-hover"
                >
                  <span className={cn(isSameDay(day, today) && 'bg-primary px-2 py-0.5 font-semibold text-primary-foreground')}>
                    {day.getDate()}
                  </span>
                </button>
                <ul className="space-y-0.5">
                  {dayMeetings.map((m) => (
                    <li key={m.id}>
                      <CalendarEventChip
                        selected={selectedMeetingId === m.id}
                        dense
                        className="block w-full text-[10px]"
                        title={`${formatTime(m.startsAt, locale)} ${m.title}`}
                        onClick={() => onMeetingClick?.(m)}
                      >
                        <span className="truncate">
                          {formatTime(m.startsAt, locale)} {m.title}
                        </span>
                      </CalendarEventChip>
                    </li>
                  ))}
                  {overflow > 0 ? (
                    <li className="px-1 text-[10px] text-muted">
                      {t('calendar.moreCount', { count: overflow })}
                    </li>
                  ) : null}
                </ul>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function startOfWeekMonday(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  const day = x.getDay()
  x.setDate(x.getDate() - ((day + 6) % 7))
  return x
}
