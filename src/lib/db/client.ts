import 'server-only'

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '@/lib/env'
import * as schema from './schema'

declare global {
  var __pg_client__: ReturnType<typeof postgres> | undefined
}

function createClient() {
  return postgres(env.DATABASE_URL, {
    prepare: false,
    // `max: 1` in dev caused serial-queueing whenever the dashboard issued
    // several API calls in parallel (e.g. /api/prospects + /api/workspace/
    // studio-settings + /api/team/seats on first paint) — second call would
    // wait minutes for the first to release the only connection. 5 matches
    // a typical local Postgres pool and stays well under Supabase pooler
    // limits.
    max: env.NODE_ENV === 'production' ? 10 : 5,
    // Recycle connections aggressively — Supabase's pgbouncer occasionally
    // drops idle pool slots without an orderly close, causing the next write
    // to hang for minutes before failing with `write CONNECTION_CLOSED
    // aws-0-eu-west-1.pooler.supabase.com:6543`. Short idle + lifetime lets
    // postgres-js reopen long before the upstream gives up.
    idle_timeout: 10,
    max_lifetime: 60,
    connect_timeout: 10,
    // Server-side query timeout. Any single statement that takes longer than
    // 30s gets cancelled by Postgres and the API route surfaces a 500 fast,
    // instead of letting Next.js wait minutes for a hung pooler connection
    // (the actual symptom of the 2026-05-22 incident).
    connection: { statement_timeout: 30_000 },
  })
}

const client = globalThis.__pg_client__ ?? createClient()

if (env.NODE_ENV !== 'production') {
  globalThis.__pg_client__ = client
}

export const db = drizzle(client, { schema, casing: 'snake_case' })

export type Database = typeof db
