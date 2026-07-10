import 'server-only'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { env } from '@/lib/env'

type CookieToSet = { name: string; value: string; options: CookieOptions }

const PUBLIC_PREFIXES = [
  '/login',
  '/register',
  '/auth/',
  '/legal/',
  '/demo/',
  '/api/health',
  '/api/inbound',
  '/_next/',
  '/favicon',
]

const STATIC_FILE_RE = /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|woff2?)$/i

const ENRICH_API_RE = /^\/api\/prospects\/[0-9a-f-]{36}\/enrich$/i

/**
 * Server-to-server (Supabase Edge, cron) calls `POST .../enrich` with
 * `X-Enrichment-Secret` and no browser session. Let the route handler validate
 * the secret; do not redirect to /login.
 */
function isInternalEnrichRequest(request: NextRequest): boolean {
  if (request.method !== 'POST') return false
  const h = request.headers.get('x-enrichment-secret')
  if (h == null || h.length === 0) return false
  return ENRICH_API_RE.test(request.nextUrl.pathname)
}

function isPublicPath(pathname: string): boolean {
  if (STATIC_FILE_RE.test(pathname)) return true
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix))
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname, search } = request.nextUrl

  if (user && (pathname === '/register' || pathname.startsWith('/register/'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.search = ''
    return NextResponse.redirect(url, { status: 302 })
  }

  if (!user && !isPublicPath(pathname) && !isInternalEnrichRequest(request)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = `?redirect=${encodeURIComponent(pathname + search)}`
    return NextResponse.redirect(url, { status: 302 })
  }

  if (user && (pathname === '/login' || pathname.startsWith('/login/'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.search = ''
    return NextResponse.redirect(url, { status: 302 })
  }

  return response
}
