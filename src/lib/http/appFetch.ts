import { handleMockRequest } from '@/mocks/router'

// Endpoints that have already been migrated off the mock router and live in
// `app/api/*` as real Next route handlers. Phase 1+ keeps extending this
// list as endpoints move from mock → Drizzle/Supabase.
const REAL_API_PREFIXES = [
  '/api/me',
  '/api/auth/',
  '/api/health',
  '/api/prospects',
  '/api/prospects/',
  '/api/team/',
] as const

function pickPathname(url: string): string | null {
  try {
    return new URL(url, 'http://localhost').pathname
  } catch {
    return url.startsWith('/api/') ? url.split('?')[0] : null
  }
}

function isMockApiUrl(url: string): boolean {
  const path = pickPathname(url)
  if (!path || !path.startsWith('/api/')) return false
  return !REAL_API_PREFIXES.some((p) => (p.endsWith('/') ? path.startsWith(p) : path === p))
}

async function toMockResponse(input: Request): Promise<Response> {
  const u = new URL(input.url, 'http://localhost')
  const method = input.method
  let body: unknown = undefined
  if (method !== 'GET' && method !== 'HEAD') {
    const text = await input.clone().text()
    if (text) {
      try {
        body = JSON.parse(text) as unknown
      } catch {
        body = undefined
      }
    }
  }
  return handleMockRequest(method, u.pathname, u.searchParams, body, input.headers)
}

export function appFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const req =
    typeof input === 'string' || input instanceof URL
      ? new Request(input.toString(), init)
      : input

  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url

  if (isMockApiUrl(url)) {
    return toMockResponse(req)
  }

  return fetch(input as RequestInfo, init)
}
