export const CLIENT_PROJECTS_QUERY_KEY = ['client-projects'] as const

export function prospectProjectsQueryKey(prospectId: string) {
  return [...CLIENT_PROJECTS_QUERY_KEY, prospectId] as const
}
