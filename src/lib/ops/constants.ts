/** How many prospects return in each OpsToday queue payload. */
export const OPS_QUEUE_LIMIT = 50

/** KPIs use this window for ratios and averages (PostgreSQL intervals in SQL strings). */
export const OPS_KPI_WINDOW_DAYS = 7 as const

/**
 * Boundary for "dossiers ready today". Uses Postgres `timezone` + truncated local day.
 * Stored as IANA TZ name for docs and embedded in raw SQL snippets.
 */
export const OPS_KPI_TIMEZONE_IANA = 'Europe/Berlin'
