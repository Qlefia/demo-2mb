import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { randomUUID } from 'crypto'
import { and, eq } from 'drizzle-orm'
import { createClient } from '@/lib/supabase/server'
import { withUserRls } from '@/lib/db/rls'
import { prospectArtifacts } from '@/lib/db/schema'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import {
  artifactImageStoragePath,
  collectImagePaths,
  isEntryRowKind,
  loadProspectWorkspace,
  MAX_ARTIFACT_IMAGES,
  PROSPECT_ARTIFACTS_BUCKET,
  toArtifactDto,
  validateParentFolder,
} from '@/lib/prospects/prospectArtifactsData'
import { normalizeExternalUrl } from '@/lib/urls/normalizeExternalUrl'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

function parseOptionalUrl(raw: FormDataEntryValue | null): string | null {
  if (typeof raw !== 'string' || raw.trim().length === 0) return null
  try {
    return normalizeExternalUrl(raw)
  } catch {
    return null
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth
  const { id: prospectId } = await ctx.params

  const ws = await loadProspectWorkspace(auth.session.access_token, prospectId)
  if (!ws) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'no_file' }, { status: 400 })
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'file_too_large' }, { status: 413 })
  }

  const mime = file.type
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) {
    return NextResponse.json({ error: 'invalid_type' }, { status: 400 })
  }

  const artifactIdRaw = formData.get('artifactId')
  const existingId =
    typeof artifactIdRaw === 'string' && artifactIdRaw.length > 0 ? artifactIdRaw : null

  const parentRaw = formData.get('parentId')
  const parentId =
    typeof parentRaw === 'string' && parentRaw.length > 0 ? parentRaw : null

  if (!existingId) {
    const parentOk = await validateParentFolder(auth.session.access_token, prospectId, parentId)
    if (!parentOk) {
      return NextResponse.json({ error: 'invalid_parent' }, { status: 422 })
    }
  }

  const titleRaw = formData.get('title')
  const bodyRaw = formData.get('body')
  const linkUrl = parseOptionalUrl(formData.get('linkUrl'))
  const title =
    typeof titleRaw === 'string' && titleRaw.trim().length > 0
      ? titleRaw.trim().slice(0, 500)
      : file.name.replace(/\.[^.]+$/, '').slice(0, 500) || 'Screenshot'
  const body = typeof bodyRaw === 'string' ? bodyRaw.trim().slice(0, 8000) || null : null

  let processed: Buffer
  try {
    const input = Buffer.from(new Uint8Array(await file.arrayBuffer()))
    processed = await sharp(input)
      .rotate()
      .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer()
  } catch {
    return NextResponse.json({ error: 'image_process_failed' }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    if (existingId) {
      const [existing] = await withUserRls(auth.session.access_token, async (tx) => {
        return tx
          .select()
          .from(prospectArtifacts)
          .where(and(eq(prospectArtifacts.id, existingId), eq(prospectArtifacts.prospectId, prospectId)))
          .limit(1)
      })
      if (!existing || !isEntryRowKind(existing.kind)) {
        return NextResponse.json({ error: 'not_found' }, { status: 404 })
      }

      const currentPaths = collectImagePaths(existing)
      if (currentPaths.length >= MAX_ARTIFACT_IMAGES) {
        return NextResponse.json({ error: 'image_limit' }, { status: 422 })
      }

      const imageId = randomUUID()
      const objectPath = artifactImageStoragePath(ws.workspaceId, prospectId, existing.id, imageId)

      const { error: uploadError } = await supabase.storage
        .from(PROSPECT_ARTIFACTS_BUCKET)
        .upload(objectPath, processed, { contentType: 'image/webp', upsert: false })

      if (uploadError) {
        return NextResponse.json({ error: 'upload_failed', message: uploadError.message }, { status: 400 })
      }

      const nextPaths = [...currentPaths, objectPath]

      const [updated] = await withUserRls(auth.session.access_token, async (tx) => {
        return tx
          .update(prospectArtifacts)
          .set({
            imagePaths: nextPaths,
            storagePath: nextPaths[0] ?? null,
            mimeType: 'image/webp',
            ...(typeof titleRaw === 'string' && titleRaw.trim() ? { title: title.trim() } : {}),
            ...(bodyRaw !== null ? { body } : {}),
            ...(formData.has('linkUrl') ? { url: linkUrl } : {}),
          })
          .where(eq(prospectArtifacts.id, existingId))
          .returning()
      })

      const item = await toArtifactDto(supabase, updated)
      return NextResponse.json({ item })
    }

    const [row] = await withUserRls(auth.session.access_token, async (tx) => {
      return tx
        .insert(prospectArtifacts)
        .values({
          prospectId,
          parentId,
          kind: 'entry',
          title,
          body,
          url: linkUrl,
          mimeType: 'image/webp',
          createdBy: auth.user.id,
        })
        .returning()
    })

    const imageId = randomUUID()
    const objectPath = artifactImageStoragePath(ws.workspaceId, prospectId, row.id, imageId)
    const { error: uploadError } = await supabase.storage
      .from(PROSPECT_ARTIFACTS_BUCKET)
      .upload(objectPath, processed, { contentType: 'image/webp', upsert: false })

    if (uploadError) {
      await withUserRls(auth.session.access_token, async (tx) => {
        await tx.delete(prospectArtifacts).where(eq(prospectArtifacts.id, row.id))
      })
      return NextResponse.json({ error: 'upload_failed', message: uploadError.message }, { status: 400 })
    }

    const [updated] = await withUserRls(auth.session.access_token, async (tx) => {
      return tx
        .update(prospectArtifacts)
        .set({ imagePaths: [objectPath], storagePath: objectPath })
        .where(eq(prospectArtifacts.id, row.id))
        .returning()
    })

    const item = await toArtifactDto(supabase, updated)
    return NextResponse.json({ item }, { status: 201 })
  } catch (err) {
    console.error('[api/prospects/.../artifacts/upload POST]', err)
    return NextResponse.json({ error: 'create_failed' }, { status: 500 })
  }
}
