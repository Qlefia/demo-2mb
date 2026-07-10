import { addDays, calendarMonthGridEnd, calendarMonthGridStart, startOfWeek } from './range'

export { addDays, calendarMonthGridEnd, calendarMonthGridStart, startOfWeek }

export function toLocalDatetimeInputFromDay(day: Date, hour = 9): string {
  const d = new Date(day)
  d.setHours(hour, 0, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
