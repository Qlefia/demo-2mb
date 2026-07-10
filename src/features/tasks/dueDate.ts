export interface DueDateInfo {
  /** Whether the task is past due. */
  overdue: boolean
  /** Human-friendly relative label key + interpolation values. */
  labelKey: string
  values: Record<string, string | number>
}

const MIN = 60 * 1000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

/**
 * Compute a relative-time hint for a task's due date.
 *
 * Buckets:
 *   - overdue >24h → "overdueDays" {days}
 *   - overdue ≤24h → "overdueHours" {hours}
 *   - due ≤1h     → "dueSoonMinutes" {minutes}
 *   - due ≤24h    → "dueHours" {hours}
 *   - due ≤7d     → "dueDays" {days}
 *   - due >7d     → "dueLater" {date}
 */
export function computeDueDate(iso: string | null, now: Date = new Date()): DueDateInfo | null {
  if (!iso) return null
  const due = new Date(iso)
  if (Number.isNaN(due.getTime())) return null
  const diffMs = due.getTime() - now.getTime()
  if (diffMs < 0) {
    const overdueMs = -diffMs
    if (overdueMs >= DAY) {
      return {
        overdue: true,
        labelKey: 'tasks.due.overdueDays',
        values: { days: Math.floor(overdueMs / DAY) },
      }
    }
    return {
      overdue: true,
      labelKey: 'tasks.due.overdueHours',
      values: { hours: Math.max(1, Math.floor(overdueMs / HOUR)) },
    }
  }
  if (diffMs <= HOUR) {
    return {
      overdue: false,
      labelKey: 'tasks.due.dueSoonMinutes',
      values: { minutes: Math.max(1, Math.floor(diffMs / MIN)) },
    }
  }
  if (diffMs <= DAY) {
    return {
      overdue: false,
      labelKey: 'tasks.due.dueHours',
      values: { hours: Math.max(1, Math.floor(diffMs / HOUR)) },
    }
  }
  if (diffMs <= 7 * DAY) {
    return {
      overdue: false,
      labelKey: 'tasks.due.dueDays',
      values: { days: Math.max(1, Math.floor(diffMs / DAY)) },
    }
  }
  return {
    overdue: false,
    labelKey: 'tasks.due.dueLater',
    values: { date: due.toISOString() },
  }
}
