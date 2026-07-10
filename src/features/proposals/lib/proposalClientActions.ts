export type ProposalPdfSource = 'published' | 'draft'

export function proposalPdfUrl(
  prospectId: string,
  proposalId: string,
  source: ProposalPdfSource,
): string {
  return `/api/prospects/${prospectId}/proposals/${proposalId}/pdf?source=${source}`
}

export function openProposalPdf(
  prospectId: string,
  proposalId: string,
  source: ProposalPdfSource,
): void {
  window.open(proposalPdfUrl(prospectId, proposalId, source), '_blank', 'noopener,noreferrer')
}

export async function deleteProposal(prospectId: string, proposalId: string): Promise<void> {
  const res = await fetch(`/api/prospects/${prospectId}/proposals/${proposalId}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('delete_failed')
}

export async function unpublishProposal(
  prospectId: string,
  proposalId: string,
): Promise<{ alreadyDraft: boolean }> {
  const res = await fetch(
    `/api/prospects/${prospectId}/proposals/${proposalId}/unpublish`,
    { method: 'POST', credentials: 'include' },
  )
  if (!res.ok) throw new Error('unpublish_failed')
  const json = (await res.json()) as { alreadyDraft?: boolean }
  return { alreadyDraft: json.alreadyDraft === true }
}

export async function publishProposal(
  prospectId: string,
  proposalId: string,
  advanceStage = false,
): Promise<{ sharePublicPath: string | null }> {
  const res = await fetch(`/api/prospects/${prospectId}/proposals/${proposalId}/publish`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ advanceStage }),
  })
  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as { message?: string; code?: string } | null
    const err = new Error(json?.message ?? 'publish_failed') as Error & { code?: string }
    err.code = json?.code
    throw err
  }
  const json = (await res.json()) as { share?: { publicPath?: string } }
  return { sharePublicPath: json.share?.publicPath ?? null }
}

export async function fetchProposalSharePath(
  prospectId: string,
  proposalId: string,
): Promise<string | null> {
  const res = await fetch(`/api/prospects/${prospectId}/proposals/${proposalId}`, {
    credentials: 'include',
    cache: 'no-store',
  })
  if (!res.ok) return null
  const json = (await res.json()) as { share?: { publicPath?: string } | null }
  return json.share?.publicPath ?? null
}

export async function copyProposalShareLink(
  prospectId: string,
  proposalId: string,
): Promise<string | null> {
  const path = await fetchProposalSharePath(prospectId, proposalId)
  if (!path) return null
  const url = `${window.location.origin}${path}`
  await navigator.clipboard.writeText(url)
  return url
}
