import type { OpenEmailInput } from '@/lib/comms/types'

export function buildMailtoUri({ to, subject, body }: OpenEmailInput): string | null {
  const trimmed = to.trim()
  if (!trimmed) return null
  const params = new URLSearchParams()
  if (subject?.trim()) params.set('subject', subject.trim())
  if (body?.trim()) params.set('body', body.trim())
  const qs = params.toString()
  return qs ? `mailto:${trimmed}?${qs}` : `mailto:${trimmed}`
}
