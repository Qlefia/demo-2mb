import type { DossierStatus } from '@/lib/db/schema/enums'
import type { DossierSections } from '@/lib/dossiers/schema'
import type { QualityCheck, QualityFailure } from '@/lib/dossiers/validate'

export interface DossierRecordDTO {
  id: string
  prospectId: string
  status: DossierStatus
  version: number
  sections: DossierSections
  aiMetadata?: Record<string, unknown> | null
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface DossierVersionListItem {
  id: string
  version: number
  generatedAt: string
  generatedBy: string | null
  changedKeys: string[]
}

export type { DossierSections, QualityCheck, QualityFailure }
