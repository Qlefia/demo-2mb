import 'server-only'

import { sql } from 'drizzle-orm'
import { db, type Database } from '@/lib/db/client'

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4)
    const decoded = Buffer.from(padded, 'base64').toString('utf-8')
    return JSON.parse(decoded) as Record<string, unknown>
  } catch {
    return null
  }
}

/**
 * Run a callback inside a transaction with `authenticated` role and the
 * caller's JWT claims set as `request.jwt.claims`. RLS policies in
 * `supabase/migrations/20260429080100_rls_policies.sql` use these to gate
 * access by role + territory + ownership.
 *
 * The DATABASE_URL points to the Supabase pooler as a privileged role that
 * normally bypasses RLS — switching to `authenticated` for the duration of
 * the transaction is what flips RLS on for the request.
 */
export async function withUserRls<T>(
  accessToken: string,
  fn: (tx: Database) => Promise<T>,
): Promise<T> {
  const claims = decodeJwtPayload(accessToken)
  const claimsJson = claims ? JSON.stringify(claims) : '{}'
  return db.transaction(async (tx) => {
    // Per-transaction safety net. The connection-level `statement_timeout`
    // (set in client.ts) does not always apply on Supabase's pgbouncer in
    // session-pool mode — a misbehaving query could hang for 30s+ before
    // anyone notices. 15s is generous for any single dashboard query
    // (typical dev SQL runs in <500ms) and short enough to surface a
    // 500 fast in the UI instead of an indefinite spinner.
    await tx.execute(sql`set local statement_timeout = '15000'`)
    await tx.execute(sql`set local role authenticated`)
    await tx.execute(sql`select set_config('request.jwt.claims', ${claimsJson}, true)`)
    return fn(tx as unknown as Database)
  })
}
