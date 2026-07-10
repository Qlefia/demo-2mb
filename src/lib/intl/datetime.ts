/**
 * Locale-aware datetime formatting helpers.
 *
 * All UI date/time rendering MUST go through these helpers (or pass an explicit
 * locale to `Intl.*`); never call `toLocaleDateString()` / `toLocaleString()`
 * without an argument — that picks up the *browser* locale (e.g. ko/jp on a
 * teammate's machine) and breaks our explicit locale contract (DE / EN / RU).
 */

const SUPPORTED = new Set(['de', 'en', 'ru'])

/**
 * Normalise an i18n language tag into a BCP-47 locale we explicitly support.
 * `de`, `de-DE`, `de_AT` → `de-DE`. `ru` → `ru-RU`. `en`, `en-GB`, anything else we don't map → `en-GB`.
 */
export function normaliseLocale(lng: string | null | undefined): string {
  const raw = (lng ?? 'en').toLowerCase().split(/[-_]/)[0]
  if (!SUPPORTED.has(raw)) return 'en-GB'
  if (raw === 'de') return 'de-DE'
  if (raw === 'ru') return 'ru-RU'
  return 'en-GB'
}

export function formatDate(
  iso: string | Date | null | undefined,
  lng: string | null | undefined,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' },
): string {
  if (!iso) return ''
  const date = typeof iso === 'string' ? new Date(iso) : iso
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(normaliseLocale(lng), options).format(date)
}

export function formatDateTime(
  iso: string | Date | null | undefined,
  lng: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  },
): string {
  return formatDate(iso, lng, options)
}

export function formatTime(
  iso: string | Date | null | undefined,
  lng: string | null | undefined,
  options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' },
): string {
  return formatDate(iso, lng, options)
}

export function formatDayHeader(
  iso: string | Date | null | undefined,
  lng: string | null | undefined,
): string {
  return formatDate(iso, lng, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
