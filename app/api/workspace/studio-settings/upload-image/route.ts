import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import {
  deleteWorkspaceStudioByUrl,
  encodeStudioImageWebp,
  sanitizeSvgString,
  uploadWorkspaceStudioAsset,
  uploadWorkspaceStudioImage,
} from '@/lib/studio/studioStorage'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import { assertUserWorkspaceAccess } from '@/lib/workspace/workspaceOnboardingData'
import { selectPrimaryWorkspaceIdForUser } from '@/lib/workspace/resolvePrimaryWorkspaceId'
import { db } from '@/lib/db/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

const deleteSchema = z.object({ url: z.string().min(1).max(2048) }).strict()

export async function POST(req: NextRequest) {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  const formData = await req.formData()
  const file = formData.get('file')
  const replaceUrl = formData.get('replaceUrl')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'no_file' }, { status: 400 })
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'file_too_large' }, { status: 413 })
  }

  const isSvg = file.type === 'image/svg+xml' || /\.svg$/i.test(file.name)
  if (!isSvg && !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return NextResponse.json({ error: 'invalid_type' }, { status: 400 })
  }

  try {
    const workspaceId = await selectPrimaryWorkspaceIdForUser(db, auth.user.id)
    const allowed = await assertUserWorkspaceAccess(auth.user.id, workspaceId)
    if (!allowed) {
      return NextResponse.json({ error: 'workspace_access_denied' }, { status: 403 })
    }

    const input = Buffer.from(new Uint8Array(await file.arrayBuffer()))
    const supabase = await createClient()

    if (typeof replaceUrl === 'string' && replaceUrl.length > 0) {
      await deleteWorkspaceStudioByUrl(supabase, replaceUrl, workspaceId)
    }

    if (isSvg) {
      const sanitized = sanitizeSvgString(input.toString('utf8'))
      if (!/<svg[\s>]/i.test(sanitized)) {
        return NextResponse.json({ error: 'image_process_failed' }, { status: 400 })
      }
      const { path, publicUrl } = await uploadWorkspaceStudioAsset(
        supabase,
        workspaceId,
        Buffer.from(sanitized, 'utf8'),
        'svg',
        'image/svg+xml',
      )
      return NextResponse.json({ url: publicUrl, path })
    }

    let processed: Buffer
    try {
      processed = await encodeStudioImageWebp(input)
    } catch {
      return NextResponse.json({ error: 'image_process_failed' }, { status: 400 })
    }

    const { path, publicUrl } = await uploadWorkspaceStudioImage(supabase, workspaceId, processed)
    return NextResponse.json({ url: publicUrl, path })
  } catch (err) {
    console.error('[api/workspace/studio-settings/upload-image POST]', err)
    return NextResponse.json({ error: 'upload_failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = deleteSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  try {
    const workspaceId = await selectPrimaryWorkspaceIdForUser(db, auth.user.id)
    const allowed = await assertUserWorkspaceAccess(auth.user.id, workspaceId)
    if (!allowed) {
      return NextResponse.json({ error: 'workspace_access_denied' }, { status: 403 })
    }

    const supabase = await createClient()
    await deleteWorkspaceStudioByUrl(supabase, parsed.data.url, workspaceId)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/workspace/studio-settings/upload-image DELETE]', err)
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
  }
}
