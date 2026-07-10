import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import {
  loadWorkspaceStudioSettingsForUser,
  saveWorkspaceStudioSettings,
} from '@/lib/workspace/workspaceStudioSettingsData'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const putSchema = z
  .object({
    expectedRevision: z.number().int().positive().optional(),
    /**
     * Allow this save to empty previously non-empty protected arrays (offices,
     * services, segments, works, reviews, documentTemplates, documentSections,
     * bankAccounts, brands). Default `false`. Must only be set from a deliberate
     * UI "delete all" action — never from the debounced auto-push subscriber.
     */
    force: z.boolean().optional(),
    general: z.record(z.string(), z.unknown()),
    sales: z.object({
      serviceCatalog: z.array(z.record(z.string(), z.unknown())),
      serviceGroups: z.array(z.record(z.string(), z.unknown())),
      segments: z.array(z.record(z.string(), z.unknown())),
      works: z.array(z.record(z.string(), z.unknown())),
      reviews: z.array(z.record(z.string(), z.unknown())),
      // `tools` and `products` were added 2026-05-21 — accept optional for
      // older clients that don't yet ship them; server backfills empty arrays.
      tools: z.array(z.record(z.string(), z.unknown())).optional(),
      products: z.array(z.record(z.string(), z.unknown())).optional(),
    }),
  })
  .strict()

export async function GET() {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  try {
    const data = await loadWorkspaceStudioSettingsForUser(auth.user.id)
    if (!data) {
      return NextResponse.json({ error: 'workspace_access_denied' }, { status: 403 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('[api/workspace/studio-settings GET]', err)
    return NextResponse.json({ error: 'query_failed' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = putSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body', issues: parsed.error.issues }, { status: 400 })
  }

  try {
    const result = await saveWorkspaceStudioSettings({
      userId: auth.user.id,
      expectedRevision: parsed.data.expectedRevision,
      force: parsed.data.force ?? false,
      snapshot: {
        general: parsed.data.general as never,
        sales: parsed.data.sales as never,
      },
    })

    if (!result.ok) {
      if (result.reason === 'forbidden') {
        return NextResponse.json({ error: 'workspace_access_denied' }, { status: 403 })
      }
      if (result.reason === 'nonempty_overwrite') {
        return NextResponse.json(
          {
            error: 'nonempty_overwrite',
            field: result.field,
            revision: result.revision,
          },
          { status: 422 },
        )
      }
      return NextResponse.json(
        { error: 'revision_conflict', revision: result.revision },
        { status: 409 },
      )
    }

    return NextResponse.json({
      ok: true,
      workspaceId: result.workspaceId,
      revision: result.revision,
    })
  } catch (err) {
    console.error('[api/workspace/studio-settings PUT]', err)
    return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  }
}
