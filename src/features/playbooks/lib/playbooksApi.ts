import type {
  CreatePlaybookInput,
  PlaybookKind,
  PlaybookSections,
  UpdatePlaybookInput,
} from '@/lib/playbooks/schema'

export type PlaybookListItem = {
  id: string
  name: string
  language: string
  kind: PlaybookKind
  summary: string
  version: number
  updatedAt: string
  bodyPreview: string
}

export type PlaybookDetail = PlaybookListItem & {
  body: string
  sections: PlaybookSections
  createdAt: string
}

async function parseError(res: Response): Promise<never> {
  let code = 'request_failed'
  try {
    const data = (await res.json()) as { error?: string }
    if (data.error) code = data.error
  } catch {
    // ignore
  }
  throw new Error(code)
}

export async function fetchPlaybooks(signal?: AbortSignal): Promise<PlaybookListItem[]> {
  const res = await fetch('/api/playbooks', { credentials: 'include', signal })
  if (!res.ok) await parseError(res)
  const data = (await res.json()) as { items?: PlaybookListItem[] }
  return data.items ?? []
}

export async function fetchPlaybook(id: string, signal?: AbortSignal): Promise<PlaybookDetail> {
  const res = await fetch(`/api/playbooks/${id}`, { credentials: 'include', signal })
  if (!res.ok) await parseError(res)
  return (await res.json()) as PlaybookDetail
}

export async function createPlaybook(input: CreatePlaybookInput): Promise<PlaybookDetail> {
  const res = await fetch('/api/playbooks', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) await parseError(res)
  return (await res.json()) as PlaybookDetail
}

export async function updatePlaybook(id: string, input: UpdatePlaybookInput): Promise<PlaybookDetail> {
  const res = await fetch(`/api/playbooks/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) await parseError(res)
  return (await res.json()) as PlaybookDetail
}

export async function deletePlaybook(id: string): Promise<void> {
  const res = await fetch(`/api/playbooks/${id}`, { method: 'DELETE', credentials: 'include' })
  if (!res.ok) await parseError(res)
}

export async function duplicatePlaybook(source: PlaybookDetail): Promise<PlaybookDetail> {
  return createPlaybook({
    name: `${source.name.trim()} (copy)`,
    language: source.language as CreatePlaybookInput['language'],
    kind: source.kind,
    summary: source.summary,
    sections: source.sections,
  })
}
