/** Monday-based calendar range helpers (local timezone). */

export function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function addDays(d: Date, days: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + days)
  return x
}

export function startOfWeek(d: Date, weekStartsOn = 1): Date {
  const x = startOfDay(d)
  const day = x.getDay()
  const diff = (day - weekStartsOn + 7) % 7
  x.setDate(x.getDate() - diff)
  return x
}

export function endOfWeek(d: Date, weekStartsOn = 1): Date {
  const start = startOfWeek(d, weekStartsOn)
  const end = addDays(start, 6)
  end.setHours(23, 59, 59, 999)
  return end
}

export function startOfMonth(d: Date): Date {
  const x = startOfDay(d)
  x.setDate(1)
  return x
}

export function endOfMonth(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
  return x
}

export function calendarMonthGridStart(d: Date, weekStartsOn = 1): Date {
  return startOfWeek(startOfMonth(d), weekStartsOn)
}

export function calendarMonthGridEnd(d: Date, weekStartsOn = 1): Date {
  const last = endOfMonth(d)
  const end = startOfWeek(last, weekStartsOn)
  return addDays(end, 6)
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function toIsoRangeStart(d: Date): string {
  return startOfDay(d).toISOString()
}

export function toIsoRangeEnd(d: Date): string {
  const x = startOfDay(d)
  x.setHours(23, 59, 59, 999)
  return x.toISOString()
}

export const DAY_START_HOUR = 7
export const DAY_END_HOUR = 21
export const HOUR_HEIGHT_PX = 44

export function meetingDurationMs(meeting: { startsAt: string; endsAt: string | null }): number {
  const start = new Date(meeting.startsAt).getTime()
  const end = meeting.endsAt ? new Date(meeting.endsAt).getTime() : start + 30 * 60 * 1000
  return Math.max(end - start, 15 * 60 * 1000)
}

export function meetingTopPx(startsAt: string): number {
  const d = new Date(startsAt)
  const hours = d.getHours() + d.getMinutes() / 60
  return Math.max(0, (hours - DAY_START_HOUR) * HOUR_HEIGHT_PX)
}

export function meetingHeightPx(meeting: { startsAt: string; endsAt: string | null }): number {
  const ms = meetingDurationMs(meeting)
  const hours = ms / (60 * 60 * 1000)
  return Math.max(HOUR_HEIGHT_PX, hours * HOUR_HEIGHT_PX)
}
