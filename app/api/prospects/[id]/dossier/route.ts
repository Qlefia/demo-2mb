import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withUserRls } from '@/lib/db/rls'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import {
  EMPTY_SECTIONS,
  dossierSectionsSchema,
} from '@/lib/dossiers/schema'
import {
  ensureProspectExists,
  loadDossierByProspect,
  saveDossierSections,
} from '@/lib/dossiers/service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const idSchema = z.string().uuid()

interface RouteContext {
  params: Promise<{ id: string }>
}

const putSchema = z
  .object({
    sections: dossierSectionsSchema,
  })
  .strict()

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params
  const parsedId = idSchema.safeParse(id)
  if (!parsedId.success) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }

  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  try {
    const result = await withUserRls(auth.session.access_token, async (tx) => {
      const exists = await ensureProspectExists(tx, parsedId.data)
      if (!exists.exists) return { ok: false as const, status: 404 }
      const dossier = await loadDossierByProspect(tx, parsedId.data)
      return { ok: true as const, dossier }
    })

    if (!result.ok) {
      return NextResponse.json({ error: 'not_found' }, { status: result.status })
    }

    if (!result.dossier) {
      return NextResponse.json(
        {
          dossier: null,
          sections: EMPTY_SECTIONS,
        },
        {
          headers: {
            'Cache-Control': 'private, no-store, max-age=0',
          },
        },
      )
    }

    return NextResponse.json(
      {
        dossier: result.dossier,
        sections: result.dossier.sections,
      },
      {
        headers: {
          'Cache-Control': 'private, no-store, max-age=0',
        },
      },
    )
  } catch (err) {
    console.error('[api/prospects/:id/dossier GET] failed', err)
    return NextResponse.json({ error: 'query_failed' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params
  const parsedId = idSchema.safeParse(id)
  if (!parsedId.success) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }

  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth
  const { user, session } = auth

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = putSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  try {
    const result = await withUserRls(session.access_token, async (tx) => {
      const exists = await ensureProspectExists(tx, parsedId.data)
      if (!exists.exists) {
        return { ok: false as const, status: 404, body: { error: 'not_found' } }
      }
      const saved = await saveDossierSections(tx, parsedId.data, parsed.data.sections, user.id)
      return { ok: true as const, saved }
    })

    if (!result.ok) {
      return NextResponse.json(result.body, { status: result.status })
    }

    return NextResponse.json({
      dossier: result.saved.dossier,
      sections: result.saved.dossier.sections,
      versionWritten: result.saved.versionWritten,
      versionNumber: result.saved.versionNumber,
      changedKeys: result.saved.changedKeys,
    })
  } catch (err) {
    console.error('[api/prospects/:id/dossier PUT] failed', err)
    return NextResponse.json({ error: 'save_failed' }, { status: 500 })
  }
}
