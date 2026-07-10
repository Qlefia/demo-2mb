'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import {
  addDays,
  calendarMonthGridEnd,
  calendarMonthGridStart,
  isSameDay,
  startOfDay,
} from '@/lib/calendar/range'

type PickerMode = 'days' | 'months'

interface CalendarMiniPickerProps {
  value: Date
  locale: string
  onSelect: (date: Date) => void
  onToday: () => void
}

function startOfWeekMonday(d: Date): Date {
  const x = startOfDay(d)
  const day = x.getDay()
  x.setDate(x.getDate() - ((day + 6) % 7))
  return x
}

export function CalendarMiniPicker({ value, locale, onSelect, onToday }: CalendarMiniPickerProps) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<PickerMode>('days')
  const [viewDate, setViewDate] = useState(() => startOfDay(value))
  const today = useMemo(() => startOfDay(new Date()), [])

  useEffect(() => {
    setViewDate(startOfDay(value))
    setMode('days')
  }, [value])

  const weekdayLabels = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = addDays(startOfWeekMonday(new Date()), i)
        return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d)
      }),
    [locale],
  )

  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(viewDate)
  const yearLabel = new Intl.DateTimeFormat(locale, { year: 'numeric' }).format(viewDate)

  function shiftMonth(delta: number) {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1))
  }

  function shiftYear(delta: number) {
    setViewDate((d) => new Date(d.getFullYear() + delta, d.getMonth(), 1))
  }

  const dayCells = useMemo(() => {
    const gridStart = calendarMonthGridStart(viewDate)
    const gridEnd = calendarMonthGridEnd(viewDate)
    const monthIndex = viewDate.getMonth()
    const cells: Date[] = []
    for (let d = new Date(gridStart); d <= gridEnd; d = addDays(d, 1)) {
      cells.push(new Date(d))
    }
    return { cells, monthIndex }
  }, [viewDate])

  const monthCells = useMemo(() => {
    const year = viewDate.getFullYear()
    return Array.from({ length: 12 }, (_, month) => new Date(year, month, 1))
  }, [viewDate])

  return (
    <div className="w-[16.5rem] select-none">
      <div className="mb-3 flex items-center justify-between gap-1">
        <button
          type="button"
          aria-label={mode === 'days' ? t('calendar.datePicker.prevMonth') : t('calendar.datePicker.prevYear')}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-hover hover:text-foreground focus-visible:outline-none"
          onClick={() => (mode === 'days' ? shiftMonth(-1) : shiftYear(-1))}
        >
          <ChevronLeft size={16} strokeWidth={1.5} aria-hidden />
        </button>

        <button
          type="button"
          className="min-w-0 flex-1 truncate px-1 text-center text-sm font-medium transition-colors hover:text-primary focus-visible:outline-none"
          onClick={() => setMode((m) => (m === 'days' ? 'months' : 'days'))}
        >
          {mode === 'days' ? monthLabel : yearLabel}
        </button>

        <button
          type="button"
          aria-label={mode === 'days' ? t('calendar.datePicker.nextMonth') : t('calendar.datePicker.nextYear')}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-hover hover:text-foreground focus-visible:outline-none"
          onClick={() => (mode === 'days' ? shiftMonth(1) : shiftYear(1))}
        >
          <ChevronRight size={16} strokeWidth={1.5} aria-hidden />
        </button>
      </div>

      {mode === 'days' ? (
        <>
          <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-medium text-muted">
            {weekdayLabels.map((label) => (
              <div key={label} className="py-1">
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {dayCells.cells.map((day) => {
              const inMonth = day.getMonth() === dayCells.monthIndex
              const isToday = isSameDay(day, today)
              const isSelected = isSameDay(day, value)
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => onSelect(startOfDay(day))}
                  className={cn(
                    'flex h-8 w-full items-center justify-center rounded-md text-xs transition-colors focus-visible:outline-none',
                    !inMonth && 'text-muted/50',
                    inMonth && 'text-foreground hover:bg-hover',
                    isToday && !isSelected && 'font-semibold text-primary',
                    isSelected && 'bg-primary font-semibold text-primary-foreground hover:bg-primary/90',
                  )}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-3 gap-1">
          {monthCells.map((monthStart) => {
            const isCurrentMonth =
              monthStart.getFullYear() === today.getFullYear() && monthStart.getMonth() === today.getMonth()
            const isSelectedMonth =
              monthStart.getFullYear() === value.getFullYear() && monthStart.getMonth() === value.getMonth()
            const label = new Intl.DateTimeFormat(locale, { month: 'short' }).format(monthStart)
            return (
              <button
                key={monthStart.toISOString()}
                type="button"
                onClick={() => {
                  setViewDate(monthStart)
                  setMode('days')
                }}
                className={cn(
                  'rounded-md px-2 py-2 text-xs transition-colors focus-visible:outline-none',
                  isSelectedMonth && 'bg-primary font-medium text-primary-foreground',
                  !isSelectedMonth && 'hover:bg-hover',
                  isCurrentMonth && !isSelectedMonth && 'font-semibold text-primary',
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
      )}

      <button
        type="button"
        className="mt-3 w-full rounded-[var(--form-field-radius)] border border-border py-2 text-xs font-medium transition-colors hover:bg-hover focus-visible:outline-none"
        onClick={onToday}
      >
        {t('calendar.today')}
      </button>
    </div>
  )
}
