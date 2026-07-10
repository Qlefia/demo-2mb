import 'server-only'

import { NextResponse } from 'next/server'
import type { Session, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export interface AuthedSession {
  user: User
  session: Session
  /**
   * The Supabase server client bound to the request cookies. Useful when the
   * caller needs to issue further reads against the same session (e.g. role
   * lookups, sign-out, etc).
   */
  supabase: Awaited<ReturnType<typeof createClient>>
}

/**
 * Hard ceiling on the `auth.getUser()` round-trip to the Supabase auth server.
 * Historically this call is what made `/api/prospects` hang for 30s+ — the
 * `supabase-js` client retries internally on network errors and there is no
 * built-in timeout. Capping it here means a flaky network surfaces as a 503
 * within seconds instead of pinning the route forever.
 */
const AUTH_VERIFY_TIMEOUT_MS = 8_000

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label}_timeout`)), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      },
    )
  })
}

/**
 * Resolve the authenticated session for the current request.
 *
 * We always call `auth.getUser()` first because that is the only call that
 * cryptographically verifies the JWT against the Supabase auth server.
 * `auth.getSession()` returns whatever is in the cookie jar without checking,
 * so by itself it is not safe to trust on the server (a tampered cookie would
 * still parse). After the user check passes we then fetch the session for the
 * `access_token` we need to forward into RLS-aware DB transactions.
 *
 * Returns either:
 *   - `{ user, session, supabase }` when the request is authenticated, or
 *   - a `NextResponse` (401 / 503) the caller should return as-is.
 */
export async function requireAuthedSession(): Promise<AuthedSession | NextResponse> {
  const supabase = await createClient()

  try {
    const {
      data: { user },
      error: userError,
    } = await withTimeout(supabase.auth.getUser(), AUTH_VERIFY_TIMEOUT_MS, 'auth_getUser')
    if (userError || !user) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }

    const {
      data: { session },
    } = await withTimeout(supabase.auth.getSession(), AUTH_VERIFY_TIMEOUT_MS, 'auth_getSession')
    if (!session) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }

    return { user, session, supabase }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'auth_failed'
    console.error('[authedSession] verify failed', message)
    return NextResponse.json({ error: 'auth_unavailable' }, { status: 503 })
  }
}

export function isAuthedSession(value: AuthedSession | NextResponse): value is AuthedSession {
  return !(value instanceof NextResponse)
}
