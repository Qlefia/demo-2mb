import { and, desc, eq, ne } from 'drizzle-orm'
import type { Database } from '@/lib/db/client'
import { workspaceMembers, workspaces } from '@/lib/db/schema'
import { DEFAULT_WORKSPACE_ID } from '@/lib/workspace/constants'

/** Shared resolver: same logic under RLS (`tx`) or privileged pool (`db`). */
export async function selectPrimaryWorkspaceIdForUser(tx: Database, userId: string): Promise<string> {
  const [ownedNonDefault] = await tx
    .select({ workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(
      and(
        eq(workspaceMembers.userId, userId),
        eq(workspaceMembers.role, 'owner'),
        ne(workspaceMembers.workspaceId, DEFAULT_WORKSPACE_ID),
      ),
    )
    .orderBy(desc(workspaces.createdAt))
    .limit(1)
  if (ownedNonDefault) return ownedNonDefault.workspaceId

  const [anyMembership] = await tx
    .select({ workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaces.id, workspaceMembers.workspaceId))
    .where(eq(workspaceMembers.userId, userId))
    .orderBy(desc(workspaces.createdAt))
    .limit(1)
  return anyMembership?.workspaceId ?? DEFAULT_WORKSPACE_ID
}

/**
 * Primary tenant for the current user: prefer an owned non-default workspace (newest),
 * then any membership (newest workspace), then the shared default id as last resort.
 */
export async function resolvePrimaryWorkspaceId(
  tx: Database,
  userId: string,
): Promise<string> {
  return selectPrimaryWorkspaceIdForUser(tx, userId)
}
