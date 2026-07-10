export {
  fetchProspects,
  fetchProspect,
  patchProspect,
  PROSPECTS_QUERY_KEY,
  ProspectsApiError,
  type PatchProspectInput,
  type PatchProspectResult,
  type ProspectsListResponse,
} from './prospectsApi'

export { useProspectsQuery } from './useProspectsQuery'

export {
  useProspectQuery,
  useProspectHeaderQuery,
  useProspectDossierQuery,
  useProspectEnrichmentJobsQuery,
} from './useProspectDetailQuery'

export {
  prospectDetailQueryKey,
  prospectHeaderQueryKey,
  prospectDossierQueryKey,
  prospectEnrichmentJobsQueryKey,
  prospectContactsQueryKey,
  prospectActivitiesQueryKey,
  playbooksQueryKey,
} from './prospectDetailQueryKeys'

export {
  useChangeProspectStageMutation,
  useReassignProspectOwnerMutation,
  useUpsertProspectCache,
  type ChangeStageVariables,
  type ReassignOwnerVariables,
} from './useProspectMutations'

export type {
  ProspectHeaderDTO,
  ProspectLastActivity,
  ProspectNextTask,
  ProspectOpenDeal,
} from '@/lib/prospects/headerData'
