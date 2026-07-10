import 'server-only'

export function isPostgresConnectionClosed(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  if (err.message.includes('CONNECTION_CLOSED')) return true
  const code = (err as { code?: string }).code
  return code === 'CONNECTION_CLOSED' || code === 'ECONNRESET'
}

/** Retry transient pooler disconnects (Supabase pgbouncer). */
export async function withDbRetry<T>(
  fn: () => Promise<T>,
  opts?: { attempts?: number; baseDelayMs?: number },
): Promise<T> {
  const attempts = opts?.attempts ?? 3
  const baseDelayMs = opts?.baseDelayMs ?? 200
  let last: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      last = err
      if (!isPostgresConnectionClosed(err) || i === attempts - 1) throw err
      await new Promise((resolve) => setTimeout(resolve, baseDelayMs * (i + 1)))
    }
  }
  throw last
}
