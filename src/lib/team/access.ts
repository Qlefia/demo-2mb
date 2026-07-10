export type PipelineRole =
  | 'founder'
  | 'ops'
  | 'sales_de'
  | 'sales_uk'
  | 'admin'
  | null
  | undefined

/**
 * Whether the viewer may open `/team/[userId]` for the given target.
 * Sales seats may only view their own profile; founder/ops/admin may view anyone.
 */
export function canViewTeamMemberProfile(
  viewerRole: PipelineRole,
  viewerId: string,
  targetUserId: string,
): boolean {
  if (!viewerId || !targetUserId) return false
  if (viewerId === targetUserId) return true
  if (!viewerRole) return false
  if (viewerRole === 'founder' || viewerRole === 'ops' || viewerRole === 'admin') return true
  return false
}
