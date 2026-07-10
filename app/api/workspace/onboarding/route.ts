import { NextRequest, NextResponse } from 'next/server'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import {
  workspaceClientSegments,
  workspaceOfferMatrix,
  workspaceOnboardingState,
  workspaceServices,
} from '@/lib/db/schema'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import { selectPrimaryWorkspaceIdForUser } from '@/lib/workspace/resolvePrimaryWorkspaceId'
import {
  assertUserWorkspaceAccess,
  loadOnboardingPayloadForUser,
} from '@/lib/workspace/workspaceOnboardingData'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const putSchema = z
  .object({
    status: z.enum(['draft', 'in_review', 'confirmed']).optional(),
    services: z
      .array(
        z.object({
          title: z.string().min(1).max(200),
          description: z.string().max(2000).optional(),
          sortOrder: z.number().int().min(0).max(999).optional(),
        }),
      )
      .max(80),
    segments: z
      .array(
        z.object({
          title: z.string().min(1).max(200),
          priority: z.number().int().min(0).max(999).optional(),
          notes: z.string().max(2000).optional(),
        }),
      )
      .max(80),
    matrix: z
      .array(
        z.object({
          serviceIndex: z.number().int().min(0),
          segmentIndex: z.number().int().min(0),
          pitch: z.string().max(4000).optional(),
        }),
      )
      .max(500),
  })
  .strict()

export async function GET() {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  try {
    const data = await loadOnboardingPayloadForUser(auth.user.id)
    if (!data) {
      return NextResponse.json({ error: 'workspace_access_denied' }, { status: 403 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('[api/workspace/onboarding GET]', err)
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
  const body = parsed.data

  try {
    const workspaceId = await selectPrimaryWorkspaceIdForUser(db, auth.user.id)
    const allowed = await assertUserWorkspaceAccess(auth.user.id, workspaceId)
    if (!allowed) {
      return NextResponse.json({ error: 'workspace_access_denied' }, { status: 403 })
    }

    await db.transaction(async (tx) => {
      await tx
        .delete(workspaceOfferMatrix)
        .where(eq(workspaceOfferMatrix.workspaceId, workspaceId))
      await tx.delete(workspaceServices).where(eq(workspaceServices.workspaceId, workspaceId))
      await tx
        .delete(workspaceClientSegments)
        .where(eq(workspaceClientSegments.workspaceId, workspaceId))

      const serviceRows =
        body.services.length > 0
          ? await tx
              .insert(workspaceServices)
              .values(
                body.services.map((s, i) => ({
                  workspaceId,
                  title: s.title,
                  description: s.description ?? null,
                  sortOrder: s.sortOrder ?? i,
                })),
              )
              .returning({ id: workspaceServices.id })
          : []

      const segmentRows =
        body.segments.length > 0
          ? await tx
              .insert(workspaceClientSegments)
              .values(
                body.segments.map((s, i) => ({
                  workspaceId,
                  title: s.title,
                  priority: s.priority ?? i,
                  notes: s.notes ?? null,
                })),
              )
              .returning({ id: workspaceClientSegments.id })
          : []

      if (body.matrix.length > 0) {
        const matrixValues = body.matrix.flatMap((m) => {
          const serviceId = serviceRows[m.serviceIndex]?.id
          const segmentId = segmentRows[m.segmentIndex]?.id
          if (!serviceId || !segmentId) return []
          return [
            {
              workspaceId,
              serviceId,
              segmentId,
              pitch: m.pitch ?? null,
            },
          ]
        })
        if (matrixValues.length > 0) {
          await tx.insert(workspaceOfferMatrix).values(matrixValues)
        }
      }

      const status = body.status ?? 'in_review'
      await tx
        .insert(workspaceOnboardingState)
        .values({ workspaceId, status })
        .onConflictDoUpdate({
          target: workspaceOnboardingState.workspaceId,
          set: { status, updatedAt: sql`now()` },
        })
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/workspace/onboarding PUT]', err)
    return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  }
}
