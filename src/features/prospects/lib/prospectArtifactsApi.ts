import type { ProspectArtifactKind } from '@/lib/prospects/prospectArtifactsData'

export type { ProspectArtifactKind }

export const MAX_ARTIFACT_IMAGES = 20

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
  imageUrl: string | null
  sortOrder: number
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export const prospectArtifactsQueryKey = (prospectId: string) =>
  ['prospects', prospectId, 'artifacts'] as const

export async function fetchProspectArtifacts(prospectId: string): Promise<ProspectArtifactDTO[]> {
  const res = await fetch(`/api/prospects/${prospectId}/artifacts`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('fetch_failed')
  const data = (await res.json()) as { items?: ProspectArtifactDTO[] }
  return data.items ?? []
}

export type CreateArtifactInput =
  | { kind: 'folder'; title: string; parentId?: string | null }
  | {
      kind: 'entry'
      title: string
      body?: string
      linkUrl?: string
      parentId?: string | null
    }

export type UpdateArtifactInput = {
  title?: string
  body?: string | null
  linkUrl?: string | null
  parentId?: string | null
  removeImagePath?: string
}

export async function createProspectArtifact(
  prospectId: string,
  input: CreateArtifactInput,
): Promise<ProspectArtifactDTO> {
  const res = await fetch(`/api/prospects/${prospectId}/artifacts`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('create_failed')
  const data = (await res.json()) as { item: ProspectArtifactDTO }
  return data.item
}

export async function updateProspectArtifact(
  prospectId: string,
  artifactId: string,
  input: UpdateArtifactInput,
): Promise<ProspectArtifactDTO> {
  const res = await fetch(`/api/prospects/${prospectId}/artifacts/${artifactId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('update_failed')
  const data = (await res.json()) as { item: ProspectArtifactDTO }
  return data.item
}

export async function uploadProspectArtifactImage(
  prospectId: string,
  file: File,
  options?: {
    artifactId?: string
    parentId?: string | null
    title?: string
    body?: string
    linkUrl?: string
  },
): Promise<ProspectArtifactDTO> {
  const form = new FormData()
  form.set('file', file)
  if (options?.artifactId) form.set('artifactId', options.artifactId)
  if (options?.parentId) form.set('parentId', options.parentId)
  if (options?.title) form.set('title', options.title)
  if (options?.body) form.set('body', options.body)
  if (options?.linkUrl) form.set('linkUrl', options.linkUrl)

  const res = await fetch(`/api/prospects/${prospectId}/artifacts/upload`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  })
  if (!res.ok) throw new Error('upload_failed')
  const data = (await res.json()) as { item: ProspectArtifactDTO }
  return data.item
}

export async function deleteProspectArtifact(
  prospectId: string,
  artifactId: string,
): Promise<void> {
  const res = await fetch(`/api/prospects/${prospectId}/artifacts/${artifactId}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('delete_failed')
}
