import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SUPABASE_REGION = 'eu-west-1'

export async function GET() {
  const startedAt = performance.now()
  try {
    const rows = await db.execute(sql`select 1 as ok`)
    const ok = Array.isArray(rows) ? rows[0]?.ok === 1 : false
    return NextResponse.json(
      {
        ok,
        db_ping_ms: Math.round(performance.now() - startedAt),
        region: SUPABASE_REGION,
      },
      { status: ok ? 200 : 503 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        db_ping_ms: Math.round(performance.now() - startedAt),
        region: SUPABASE_REGION,
        error: error instanceof Error ? error.message : 'unknown_error',
      },
      { status: 503 },
    )
  }
}
