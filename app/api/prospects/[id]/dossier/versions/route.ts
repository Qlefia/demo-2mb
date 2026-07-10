import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sql } from 'drizzle-orm'
import { withUserRls } from '@/lib/db/rls'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const idSchema = z.string().uuid()

interface RouteContext {
  params: Promise<{ id: string }>
}

interface VersionRow {
  id: string
  version: number
  generated_at: string
  generated_by: string | null
  changed_keys: string[] | null
}

export async function GET(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params
  const parsedId = idSchema.safeParse(id)
  if (!parsedId.success) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }

  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth
  const { session } = auth

  try {
    const versions = await withUserRls(session.access_token, async (tx) => {
      const result = await tx.execute(sql`
        select
          v.id,
          v.version,
          v.generated_at,
          v.generated_by,
          v.sections_diff -> 'changedKeys' as changed_keys
        from dossier_versions v
        join dossiers d on d.id = v.dossier_id
        where d.prospect_id = ${parsedId.data}::uuid
        order by v.version desc
        limit 50
      `)
      const rows = (result as unknown as VersionRow[]) ?? []
      return rows.map((r) => ({
        id: r.id,
        version: r.version,
        generatedAt: new Date(r.generated_at).toISOString(),
        generatedBy: r.generated_by,
        changedKeys: Array.isArray(r.changed_keys) ? r.changed_keys : [],
      }))
    })

    return NextResponse.json({ versions })
  } catch (err) {
    console.error('[api/prospects/:id/dossier/versions GET] failed', err)
    return NextResponse.json({ error: 'query_failed' }, { status: 500 })
  }
}
