import 'server-only'

const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 120

const buckets = new Map<string, { count: number; resetAt: number }>()

/** In-memory stub; replace with edge/WAF limits in production if needed. */
export function checkInboundRateLimit(key: string): { ok: boolean; retryAfterSec?: number } {
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    prune(now)
    return { ok: true }
  }
  if (b.count >= MAX_PER_WINDOW) {
    return { ok: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) }
  }
  b.count += 1
  prune(now)
  return { ok: true }
}

function prune(now: number) {
  if (buckets.size < 5000) return
  for (const [k, v] of buckets) {
    if (now >= v.resetAt + WINDOW_MS) buckets.delete(k)
  }
}
