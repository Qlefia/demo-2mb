import type { DossierSections } from '@/lib/dossiers/schema'
import type { DossierRecordDTO } from '@/features/dossiers/types'

export type PutDossierSectionsResult = {
  dossier: DossierRecordDTO
  sections: DossierSections
  versionWritten: boolean
  versionNumber: number
}

export async function putDossierSections(
  prospectId: string,
  sections: DossierSections,
): Promise<PutDossierSectionsResult> {
  const res = await fetch(`/api/prospects/${prospectId}/dossier`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sections }),
  })
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error ?? 'save_failed')
  }
  return res.json() as Promise<PutDossierSectionsResult>
}
