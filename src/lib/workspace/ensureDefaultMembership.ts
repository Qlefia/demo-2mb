import 'server-only'

import { db } from '@/lib/db/client'
import { workspaceMembers } from '@/lib/db/schema'
import { DEFAULT_WORKSPACE_ID } from '@/lib/workspace/constants'

/**
 * Idempotent: every signed-in user must belong to the default workspace so
 * restrictive workspace RLS (see studio migration) does not hide all CRM rows.
 * Runs with DATABASE_URL privileges (bypasses RLS).
 */
export async function ensureDefaultWorkspaceMembershipForUser(userId: string): Promise<void> {
  if (!userId) return
  await db
    .insert(workspaceMembers)
    .values({
      workspaceId: DEFAULT_WORKSPACE_ID,
      userId,
      role: 'member',
    })
    .onConflictDoNothing()
}
