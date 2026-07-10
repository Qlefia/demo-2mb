import 'server-only'

import { timingSafeEqual } from 'node:crypto'

export function verifyWebhookSecret(raw: string, expected: string): boolean {
  const a = Buffer.from(raw, 'utf8')
  const b = Buffer.from(expected, 'utf8')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
