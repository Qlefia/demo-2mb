import 'server-only'

import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

export type AuthSessionRecord = {
  id: string
  createdAt: string
  lastActiveAt: string
  userAgent: string | null
  ip: string | null
}

type SessionRow = {
  id: string
  created_at: Date | string
  updated_at: Date | string
  refreshed_at: Date | string | null
  user_agent: string | null
  ip: string | null
}

function toIso(value: Date | string | null | undefined): string {
  if (!value) return new Date(0).toISOString()
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString()
}

/** Sessions with no refresh/update longer than this are hidden from the list. */
export const SESSION_ACTIVE_MAX_AGE_DAYS = 7

export async function listAuthSessionsForUser(
  userId: string,
  currentSessionId?: string | null,
): Promise<AuthSessionRecord[]> {
  const result = await db.execute(sql`
    SELECT
      id,
      created_at,
      updated_at,
      refreshed_at,
      user_agent,
      host(ip) AS ip
    FROM auth.sessions
    WHERE user_id = ${userId}::uuid
      AND (not_after IS NULL OR not_after > now())
      AND (
        ${currentSessionId ?? null}::uuid IS NOT NULL AND id = ${currentSessionId ?? null}::uuid
        OR GREATEST(
          created_at,
          updated_at,
          COALESCE(refreshed_at AT TIME ZONE 'UTC', updated_at, created_at)
        ) > now() - make_interval(days => ${SESSION_ACTIVE_MAX_AGE_DAYS})
      )
    ORDER BY GREATEST(
      created_at,
      updated_at,
      COALESCE(refreshed_at AT TIME ZONE 'UTC', updated_at, created_at)
    ) DESC
  `)

  const rows = result as unknown as SessionRow[]

  return rows.map((row) => ({
    id: row.id,
    createdAt: toIso(row.created_at),
    lastActiveAt: toIso(row.refreshed_at ?? row.updated_at ?? row.created_at),
    userAgent: row.user_agent,
    ip: row.ip,
  }))
}

export async function deleteAuthSessionForUser(userId: string, sessionId: string): Promise<boolean> {
  const result = await db.execute(sql`
    DELETE FROM auth.sessions
    WHERE id = ${sessionId}::uuid
      AND user_id = ${userId}::uuid
    RETURNING id
  `)

  const rows = result as unknown as { id: string }[]
  return rows.length > 0
}
