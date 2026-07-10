import { NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { withUserRls } from '@/lib/db/rls'
import { prospectArtifacts } from '@/lib/db/schema'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import {
  collectImagePaths,
  deleteArtifactStorage,
  isEntryRowKind,
  PROSPECT_ARTIFACTS_BUCKET,
  toArtifactDto,
  validateParentFolder,
} from '@/lib/prospects/prospectArtifactsData'
import { artifactLinkUrlSchema } from '@/lib/prospects/artifactLinkUrlSchema'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const linkUrlSchema = artifactLinkUrlSchema

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string; artifactId: string }> }) {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth
  const { id: prospectId, artifactId } = await ctx.params

  const patchSchema = z
    .object({
      title: z.string().min(1).max(500).optional(),
      body: z.string().max(8000).nullable().optional(),
      linkUrl: linkUrlSchema,
      parentId: z.string().uuid().nullable().optional(),
      removeImagePath: z.string().min(1).max(500).optional(),
    })
    .strict()

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const parsed = patchSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body', issues: parsed.error.issues }, { status: 400 })
  }

  if (parsed.data.parentId !== undefined) {
    const parentOk = await validateParentFolder(
      auth.session.access_token,
      prospectId,
      parsed.data.parentId,
    )
    if (!parentOk) {
      return NextResponse.json({ error: 'invalid_parent' }, { status: 422 })
    }
  }

  try {
    const result = await withUserRls(auth.session.access_token, async (tx) => {
      const [existing] = await tx
        .select()
        .from(prospectArtifacts)
        .where(and(eq(prospectArtifacts.id, artifactId), eq(prospectArtifacts.prospectId, prospectId)))
        .limit(1)
      if (!existing) return null

      const update: Partial<typeof prospectArtifacts.$inferInsert> = {}
      if (parsed.data.title !== undefined) update.title = parsed.data.title.trim()
      if (parsed.data.body !== undefined && isEntryRowKind(existing.kind)) {
        update.body = parsed.data.body?.trim() || null
      }
      if (parsed.data.linkUrl !== undefined && isEntryRowKind(existing.kind)) {
        update.url =
          parsed.data.linkUrl && parsed.data.linkUrl.length > 0 ? parsed.data.linkUrl.trim() : null
      }
      if (parsed.data.parentId !== undefined) {
        if (parsed.data.parentId === artifactId) return null
        update.parentId = parsed.data.parentId
      }

      let removedPath: string | null = null
      if (parsed.data.removeImagePath !== undefined && isEntryRowKind(existing.kind)) {
        const currentPaths = collectImagePaths(existing)
        if (!currentPaths.includes(parsed.data.removeImagePath)) return null
        const nextPaths = currentPaths.filter((p) => p !== parsed.data.removeImagePath)
        update.imagePaths = nextPaths
        update.storagePath = nextPaths[0] ?? null
        if (nextPaths.length === 0) update.mimeType = null
        removedPath = parsed.data.removeImagePath
      }

      if (Object.keys(update).length === 0) {
        return { row: existing, removedPath: null as string | null }
      }

      const [updated] = await tx
        .update(prospectArtifacts)
        .set(update)
        .where(eq(prospectArtifacts.id, artifactId))
        .returning()

      return { row: updated, removedPath }
    })

    if (!result) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    const supabase = await createClient()
    if (result.removedPath) {
      await supabase.storage.from(PROSPECT_ARTIFACTS_BUCKET).remove([result.removedPath])
    }
    const item = await toArtifactDto(supabase, result.row)
    return NextResponse.json({ item })
  } catch (err) {
    console.error('[api/prospects/.../artifacts/[artifactId] PATCH]', err)
    return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, ctx: { params: Promise<{ id: string; artifactId: string }> }) {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth
  const { id: prospectId, artifactId } = await ctx.params

  try {
    const deleted = await withUserRls(auth.session.access_token, async (tx) => {
      const [existing] = await tx
        .select()
        .from(prospectArtifacts)
        .where(and(eq(prospectArtifacts.id, artifactId), eq(prospectArtifacts.prospectId, prospectId)))
        .limit(1)
      if (!existing) return null

      await tx.delete(prospectArtifacts).where(eq(prospectArtifacts.id, artifactId))
      return existing
    })

    if (!deleted) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    const supabase = await createClient()
    await deleteArtifactStorage(supabase, deleted)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/prospects/.../artifacts/[artifactId] DELETE]', err)
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
  }
}
