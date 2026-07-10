import { NextRequest, NextResponse } from 'next/server'
import { isAuthedSession, requireAuthedSession } from '@/lib/supabase/authedSession'
import { getServiceClient } from '@/lib/supabase/service'
import {
  deleteUserAvatarByUrl,
  encodeAvatarWebp,
  uploadUserAvatar,
} from '@/lib/user/avatarStorage'
import { mergeProfileMetaPatch, profileMetaToClientUser, readProfileMetaFromAuth } from '@/lib/user/profileMeta'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

function pickRole(value: unknown): string | null {
  if (typeof value !== 'string') return null
  return value.length > 0 ? value : null
}

function pickTerritory(value: unknown): 'DE' | 'UK' | null {
  return value === 'DE' || value === 'UK' ? value : null
}

export async function POST(request: NextRequest) {
  const auth = await requireAuthedSession()
  if (!isAuthedSession(auth)) return auth

  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'no_file' }, { status: 400 })
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'file_too_large' }, { status: 413 })
  }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return NextResponse.json({ error: 'invalid_type' }, { status: 400 })
  }

  try {
    const input = Buffer.from(new Uint8Array(await file.arrayBuffer()))
    let processed: Buffer
    try {
      processed = await encodeAvatarWebp(input)
    } catch {
      return NextResponse.json({ error: 'image_process_failed' }, { status: 400 })
    }

    const currentMeta = (auth.user.user_metadata ?? {}) as Record<string, unknown>
    const sanitized = readProfileMetaFromAuth(currentMeta)

    // Storage upload via service role — path is locked to the authenticated user id.
    const storage = getServiceClient()
    await deleteUserAvatarByUrl(storage, sanitized.avatar_url, auth.user.id)
    const { publicUrl } = await uploadUserAvatar(storage, auth.user.id, processed)

    const nextMeta = mergeProfileMetaPatch(currentMeta, {
      avatarUrl: publicUrl,
      avatarType: 'photo',
    })

    const { data, error: updateError } = await auth.supabase.auth.updateUser({ data: nextMeta })
    if (updateError || !data.user) {
      console.error('[api/me/avatar POST] updateUser failed', updateError?.message)
      return NextResponse.json(
        { error: 'update_failed', message: updateError?.message ?? 'unknown' },
        { status: 500 },
      )
    }

    const updatedMeta = readProfileMetaFromAuth(
      (data.user.user_metadata ?? {}) as Record<string, unknown>,
    )
    const appMeta = (data.user.app_metadata ?? {}) as Record<string, unknown>
    const email = data.user.email ?? ''

    return NextResponse.json({
      avatarUrl: updatedMeta.avatar_url ?? publicUrl,
      user: profileMetaToClientUser(data.user.id, email, updatedMeta),
      role: pickRole(appMeta.role),
      territory: pickTerritory(appMeta.territory),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'upload_failed'
    console.error('[api/me/avatar POST] failed', err)
    return NextResponse.json({ error: 'upload_failed', message }, { status: 500 })
  }
}
