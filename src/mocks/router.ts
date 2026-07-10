import { MOCK_USER_ID } from '@/mocks/ids'
import { getMockState } from '@/mocks/state'

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status })
}

function parseJsonBody(body: unknown): Record<string, unknown> | null {
  if (body != null && typeof body === 'object' && !Array.isArray(body)) {
    return body as Record<string, unknown>
  }
  return null
}

/**
 * Mock router for endpoints not yet migrated to real Supabase/Drizzle handlers.
 *
 * Real handlers live under `app/api/*` and are exempted from this router via
 * `appFetch` (`REAL_API_PREFIXES`). Anything that hits this router has no
 * Postgres backing yet and will be migrated in later phases.
 *
 * Currently mocked:
 *   - GET/POST /api/me/consent-log
 *   - GET /api/notifications
 *   - POST /api/notifications/read
 */
export function handleMockRequest(
  method: string,
  pathname: string,
  _searchParams: URLSearchParams,
  body: unknown,
  _headers: Headers,
): Response {
  const parts = pathname.split('/').filter(Boolean)
  const s = getMockState()

  if (parts[0] !== 'api') return json({ error: 'not_found' }, 404)

  if (parts[1] === 'me' && parts[2] === 'consent-log' && parts.length === 3) {
    if (method === 'GET') return json({ items: s.consentLog })
    if (method === 'POST') {
      const b = parseJsonBody(body)
      if (b && typeof b.category === 'string' && typeof b.granted === 'boolean') {
        s.consentLog.unshift({
          id: crypto.randomUUID(),
          category: b.category,
          granted: b.granted,
          changedAt: new Date().toISOString(),
        })
      }
      return json({ ok: true })
    }
  }

  if (parts[1] === 'notifications' && parts.length === 2 && method === 'GET') {
    return json({ items: s.notifications })
  }

  if (parts[1] === 'notifications' && parts[2] === 'read' && parts.length === 3 && method === 'POST') {
    const b = parseJsonBody(body)
    const ids = Array.isArray(b?.ids) ? (b.ids as string[]) : null
    if (ids) {
      for (const n of s.notifications) if (ids.includes(n.id)) n.read = true
    } else {
      for (const n of s.notifications) n.read = true
    }
    return json({ ok: true })
  }

  void MOCK_USER_ID
  return json({ error: 'not_found', path: pathname }, 404)
}
