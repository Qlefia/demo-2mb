import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { StudioProfileSnapshot } from '@/lib/studio/studioProfileSnapshot'
import {
  dataUrlToBuffer,
  encodeStudioImageWebp,
  isStudioDataImageUrl,
  uploadWorkspaceStudioImage,
} from '@/lib/studio/studioStorage'

async function migrateString(
  value: string,
  workspaceId: string,
  supabase: SupabaseClient,
): Promise<string> {
  if (!isStudioDataImageUrl(value)) return value
  const raw = dataUrlToBuffer(value)
  if (!raw) return value
  const webp = await encodeStudioImageWebp(raw)
  const { publicUrl } = await uploadWorkspaceStudioImage(supabase, workspaceId, webp)
  return publicUrl
}

async function migrateNode(
  node: unknown,
  workspaceId: string,
  supabase: SupabaseClient,
): Promise<unknown> {
  if (typeof node === 'string') {
    return migrateString(node, workspaceId, supabase)
  }
  if (Array.isArray(node)) {
    const next: unknown[] = []
    for (const item of node) {
      next.push(await migrateNode(item, workspaceId, supabase))
    }
    return next
  }
  if (node && typeof node === 'object') {
    const record = node as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(record)) {
      out[key] = await migrateNode(value, workspaceId, supabase)
    }
    return out
  }
  return node
}

/** Replaces inline `data:image/*` strings with Supabase Storage public URLs. */
export async function migrateStudioProfileSnapshotImages(
  snapshot: StudioProfileSnapshot,
  workspaceId: string,
  supabase: SupabaseClient,
): Promise<StudioProfileSnapshot> {
  const cloned = structuredClone(snapshot)
  const general = (await migrateNode(cloned.general, workspaceId, supabase)) as StudioProfileSnapshot['general']
  const sales = (await migrateNode(cloned.sales, workspaceId, supabase)) as StudioProfileSnapshot['sales']
  return { general, sales }
}

export function snapshotContainsDataImages(snapshot: StudioProfileSnapshot): boolean {
  const json = JSON.stringify(snapshot)
  return json.includes('data:image')
}
