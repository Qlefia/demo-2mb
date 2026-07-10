import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withUserRls } from '@/lib/db/rls'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import { acceptOfferSchema } from '@/lib/client-projects/schema'
import { acceptOfferOnProject } from '@/lib/client-projects/service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const idSchema = z.string().uuid()

interface RouteContext {
  params: Promise<{ id: string; projectId: string }>
}

function pickRole(value: unknown) {
  if (
    value === 'founder' ||
    value === 'ops' ||
    value === 'admin' ||
    value === 'sales_de' ||
    value === 'sales_uk'
  ) {
    return value
  }
  return null
}

export async function POST(request: NextRequest, ctx: RouteContext) {
  const { id, projectId } = await ctx.params
  const parsedProspect = idSchema.safeParse(id)
  const parsedProject = idSchema.safeParse(projectId)
  if (!parsedProspect.success || !parsedProject.success) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }

  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const parsed = acceptOfferSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const role = pickRole((auth.user.app_metadata ?? {}).role)

  try {
    const result = await withUserRls(auth.session.access_token, async (tx) =>
      acceptOfferOnProject(tx, {
        prospectId: parsedProspect.data,
        projectId: parsedProject.data,
        offerId: parsed.data.offerId,
        actorId: auth.user.id,
        role,
      }),
    )

    if (!result.ok) {
      const status = result.error === 'offer_not_published' ? 422 : 404
      return NextResponse.json({ error: result.error }, { status })
    }
    return NextResponse.json({ project: result.project })
  } catch (err) {
    console.error('[api/prospects/:id/projects/:projectId/accept-offer POST] failed', err)
    return NextResponse.json({ error: 'accept_failed' }, { status: 500 })
  }
}
