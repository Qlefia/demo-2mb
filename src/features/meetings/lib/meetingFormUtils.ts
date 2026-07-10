const DEFAULT_DURATION_MS = 30 * 60 * 1000

export { DEFAULT_DURATION_MS }

export function toLocalDatetimeInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function fromLocalDatetimeInput(value: string): string {
  return new Date(value).toISOString()
}

export function defaultStartsAtLocal(): string {
  const d = new Date()
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0)
  d.setHours(d.getHours() + 1)
  return toLocalDatetimeInput(d.toISOString())
}

export function defaultEndsAtLocal(startsLocal: string): string {
  const startIso = fromLocalDatetimeInput(startsLocal)
  const end = new Date(new Date(startIso).getTime() + DEFAULT_DURATION_MS)
  return toLocalDatetimeInput(end.toISOString())
}
