import { eq } from 'drizzle-orm'
import type { SupabaseClient } from '@supabase/supabase-js'
import { withUserRls } from '@/lib/db/rls'
import { prospectArtifacts, prospects } from '@/lib/db/schema'

export const PROSPECT_ARTIFACTS_BUCKET = 'prospect-artifacts'
export const MAX_ARTIFACT_IMAGES = 20
const SIGNED_URL_TTL_SEC = 60 * 60

export type ProspectArtifactRow = typeof prospectArtifacts.$inferSelect

export type ProspectArtifactKind = 'folder' | 'entry'

export type ProspectArtifactImageDTO = {
  path: string
  url: string
}

export type ProspectArtifactDTO = {
  id: string
  prospectId: string
  parentId: string | null
  kind: ProspectArtifactKind
  title: string
  body: string | null
  linkUrl: string | null
  images: ProspectArtifactImageDTO[]
  /** First image signed URL — list card thumbnail. */
  imageUrl: string | null
  sortOrder: number
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export function isEntryRowKind(kind: string): boolean {
  return kind !== 'folder'
}

export function normalizeArtifactKind(kind: string): ProspectArtifactKind {
  return kind === 'folder' ? 'folder' : 'entry'
}

export function artifactStoragePath(
  workspaceId: string,
  prospectId: string,
  artifactId: string,
): string {
  return `${workspaceId}/${prospectId}/${artifactId}.webp`
}

export function artifactImageStoragePath(
  workspaceId: string,
  prospectId: string,
  artifactId: string,
  imageId: string,
): string {
  return `${workspaceId}/${prospectId}/${artifactId}/${imageId}.webp`
}

export function collectImagePaths(row: ProspectArtifactRow): string[] {
  if (row.imagePaths && row.imagePaths.length > 0) return row.imagePaths
  if (row.storagePath) return [row.storagePath]
  return []
}

export async function loadProspectWorkspace(
  accessToken: string,
  prospectId: string,
): Promise<{ workspaceId: string } | null> {
  const row = await withUserRls(accessToken, async (tx) => {
    const [p] = await tx
      .select({ workspaceId: prospects.workspaceId })
      .from(prospects)
      .where(eq(prospects.id, prospectId))
      .limit(1)
    return p ?? null
  })
  return row
}

async function signedImageUrl(
  supabase: SupabaseClient,
  storagePath: string | null,
): Promise<string | null> {
  if (!storagePath) return null
  const { data, error } = await supabase.storage
    .from(PROSPECT_ARTIFACTS_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SEC)
  if (error || !data?.signedUrl) return null
  return data.signedUrl
}

async function signedImages(
  supabase: SupabaseClient,
  paths: string[],
): Promise<ProspectArtifactImageDTO[]> {
  const images: ProspectArtifactImageDTO[] = []
  for (const path of paths) {
    const url = await signedImageUrl(supabase, path)
    if (url) images.push({ path, url })
  }
  return images
}

export async function toArtifactDto(
  supabase: SupabaseClient,
  row: ProspectArtifactRow,
): Promise<ProspectArtifactDTO> {
  const kind = normalizeArtifactKind(row.kind)
  const paths = kind === 'entry' ? collectImagePaths(row) : []
  const images = kind === 'entry' ? await signedImages(supabase, paths) : []

  return {
    id: row.id,
    prospectId: row.prospectId,
    parentId: row.parentId,
    kind,
    title: row.title,
    body: row.body,
    linkUrl: kind === 'entry' ? row.url : null,
    images,
    imageUrl: images[0]?.url ?? null,
    sortOrder: row.sortOrder,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function validateParentFolder(
  accessToken: string,
  prospectId: string,
  parentId: string | null | undefined,
): Promise<boolean> {
  if (!parentId) return true
  const parent = await withUserRls(accessToken, async (tx) => {
    const [row] = await tx
      .select({ kind: prospectArtifacts.kind, prospectId: prospectArtifacts.prospectId })
      .from(prospectArtifacts)
      .where(eq(prospectArtifacts.id, parentId))
      .limit(1)
    return row ?? null
  })
  return parent?.prospectId === prospectId && parent.kind === 'folder'
}

export async function deleteArtifactStoragePaths(
  supabase: SupabaseClient,
  paths: string[],
): Promise<void> {
  if (paths.length === 0) return
  await supabase.storage.from(PROSPECT_ARTIFACTS_BUCKET).remove(paths)
}

export async function deleteArtifactStorage(
  supabase: SupabaseClient,
  row: Pick<ProspectArtifactRow, 'storagePath' | 'imagePaths'>,
): Promise<void> {
  const paths = collectImagePaths(row as ProspectArtifactRow)
  await deleteArtifactStoragePaths(supabase, paths)
}
