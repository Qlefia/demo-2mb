import 'server-only'

import sharp from 'sharp'
import type { SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

export const USER_AVATARS_BUCKET = 'user-avatars'

export function userAvatarObjectPath(userId: string): string {
  return `${userId}/avatar.webp`
}

export function userAvatarPublicUrl(objectPath: string, cacheBust?: number): string {
  const base = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, '')
  const url = `${base}/storage/v1/object/public/${USER_AVATARS_BUCKET}/${objectPath}`
  return cacheBust ? `${url}?v=${cacheBust}` : url
}

export function userAvatarPathFromPublicUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    const marker = `/storage/v1/object/public/${USER_AVATARS_BUCKET}/`
    const idx = parsed.pathname.indexOf(marker)
    if (idx === -1) return null
    return decodeURIComponent(parsed.pathname.slice(idx + marker.length))
  } catch {
    return null
  }
}

export async function encodeAvatarWebp(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize(512, 512, { fit: 'cover', position: 'centre' })
    .webp({ quality: 85, effort: 4 })
    .toBuffer()
}

export async function uploadUserAvatar(
  supabase: SupabaseClient,
  userId: string,
  bytes: Buffer,
): Promise<{ path: string; publicUrl: string }> {
  const path = userAvatarObjectPath(userId)
  await supabase.storage.from(USER_AVATARS_BUCKET).remove([path])
  const { error } = await supabase.storage.from(USER_AVATARS_BUCKET).upload(path, bytes, {
    contentType: 'image/webp',
    upsert: false,
  })
  if (error) throw error
  return { path, publicUrl: userAvatarPublicUrl(path, Date.now()) }
}

export async function deleteUserAvatarByUrl(
  supabase: SupabaseClient,
  url: string | null | undefined,
  userId: string,
): Promise<void> {
  if (!url) return
  const path = userAvatarPathFromPublicUrl(url)
  if (!path || !path.startsWith(`${userId}/`)) return
  await supabase.storage.from(USER_AVATARS_BUCKET).remove([path])
}
