import 'server-only'

import sharp from 'sharp'
import type { SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

export const WORKSPACE_STUDIO_BUCKET = 'workspace-studio'

const DATA_IMAGE_RE = /^data:image\/[\w+.-]+;base64,/

export function isStudioDataImageUrl(value: string): boolean {
  return DATA_IMAGE_RE.test(value)
}

/** Object path inside bucket: `{workspaceId}/media/{uuid}.webp` */
export function workspaceStudioMediaPath(workspaceId: string, fileId: string): string {
  return `${workspaceId}/media/${fileId}.webp`
}

/** Object path with custom extension (e.g. `.svg` for vector logos). */
export function workspaceStudioMediaPathExt(
  workspaceId: string,
  fileId: string,
  ext: string,
): string {
  const clean = ext.replace(/^\.+/, '').toLowerCase()
  return `${workspaceId}/media/${fileId}.${clean}`
}

/** Strip <script>, on* event handlers, and javascript: links from inline SVG before storing it. */
export function sanitizeSvgString(svg: string): string {
  return svg
    .replace(/<\s*script\b[\s\S]*?<\s*\/\s*script\s*>/gi, '')
    .replace(/<\s*script\b[^>]*\/?>/gi, '')
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '')
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '')
    .replace(/(href|xlink:href)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '')
}

export function workspaceStudioPublicUrl(objectPath: string): string {
  const base = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, '')
  return `${base}/storage/v1/object/public/${WORKSPACE_STUDIO_BUCKET}/${objectPath}`
}

/** Extract storage object path from a public workspace-studio URL, if applicable. */
export function studioStoragePathFromPublicUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    const marker = `/storage/v1/object/public/${WORKSPACE_STUDIO_BUCKET}/`
    const idx = parsed.pathname.indexOf(marker)
    if (idx === -1) return null
    return decodeURIComponent(parsed.pathname.slice(idx + marker.length))
  } catch {
    return null
  }
}

export function isWorkspaceStudioStorageUrl(url: string): boolean {
  return studioStoragePathFromPublicUrl(url) !== null
}

export async function encodeStudioImageWebp(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
    .webp({
      quality: 85,
      alphaQuality: 90,
      lossless: false,
      effort: 6,
      smartSubsample: true,
    })
    .toBuffer()
}

export async function uploadWorkspaceStudioImage(
  supabase: SupabaseClient,
  workspaceId: string,
  bytes: Buffer,
): Promise<{ path: string; publicUrl: string }> {
  const path = workspaceStudioMediaPath(workspaceId, crypto.randomUUID())
  const { error } = await supabase.storage.from(WORKSPACE_STUDIO_BUCKET).upload(path, bytes, {
    contentType: 'image/webp',
    upsert: false,
  })
  if (error) throw new Error(error.message)
  return { path, publicUrl: workspaceStudioPublicUrl(path) }
}

/** Upload an arbitrary asset (e.g. sanitized SVG) without WebP re-encoding. */
export async function uploadWorkspaceStudioAsset(
  supabase: SupabaseClient,
  workspaceId: string,
  bytes: Buffer,
  ext: string,
  contentType: string,
): Promise<{ path: string; publicUrl: string }> {
  const path = workspaceStudioMediaPathExt(workspaceId, crypto.randomUUID(), ext)
  const { error } = await supabase.storage.from(WORKSPACE_STUDIO_BUCKET).upload(path, bytes, {
    contentType,
    upsert: false,
  })
  if (error) throw new Error(error.message)
  return { path, publicUrl: workspaceStudioPublicUrl(path) }
}

export async function deleteWorkspaceStudioObject(
  supabase: SupabaseClient,
  objectPath: string,
  workspaceId: string,
): Promise<void> {
  if (!objectPath.startsWith(`${workspaceId}/`)) return
  await supabase.storage.from(WORKSPACE_STUDIO_BUCKET).remove([objectPath])
}

export async function deleteWorkspaceStudioByUrl(
  supabase: SupabaseClient,
  url: string,
  workspaceId: string,
): Promise<void> {
  const path = studioStoragePathFromPublicUrl(url)
  if (!path) return
  await deleteWorkspaceStudioObject(supabase, path, workspaceId)
}

export function dataUrlToBuffer(dataUrl: string): Buffer | null {
  const comma = dataUrl.indexOf(',')
  if (comma === -1) return null
  try {
    return Buffer.from(dataUrl.slice(comma + 1), 'base64')
  } catch {
    return null
  }
}
