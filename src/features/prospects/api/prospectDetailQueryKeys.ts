export const prospectDetailQueryKey = (prospectId: string) =>
  ['prospect', prospectId, 'detail'] as const

export const prospectHeaderQueryKey = (prospectId: string) =>
  ['prospect', prospectId, 'header'] as const

export const prospectDossierQueryKey = (prospectId: string) =>
  ['prospect', prospectId, 'dossier'] as const

export const prospectEnrichmentJobsQueryKey = (prospectId: string) =>
  ['prospect', prospectId, 'enrichment-jobs'] as const

export const prospectContactsQueryKey = (prospectId: string) =>
  ['prospect', prospectId, 'contacts'] as const

export const prospectActivitiesQueryKey = (prospectId: string) =>
  ['prospect', prospectId, 'activities'] as const

export { playbooksListQueryKey as playbooksQueryKey } from '@/features/playbooks/lib/playbookQueryKeys'
