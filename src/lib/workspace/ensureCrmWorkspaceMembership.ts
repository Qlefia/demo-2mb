import 'server-only'

import { db } from '@/lib/db/client'
import { workspaceMembers } from '@/lib/db/schema'
import { DEFAULT_WORKSPACE_ID } from '@/lib/workspace/constants'

/**
 * Every CRM user must be a member of the shared default workspace so restrictive
 * RLS policies on `prospects`, `accounts`, etc. can pass `user_has_workspace_access`.
 * Users who signed up after the one-time backfill in `20260515153000` only got a
 * personal studio workspace via `provisionStudioWorkspace` and were invisible to
 * prospect list queries (empty Kanban, HTTP 200).
 */
export async function ensureCrmWorkspaceMembership(userId: string): Promise<void> {
  await db
    .insert(workspaceMembers)
    .values({
      workspaceId: DEFAULT_WORKSPACE_ID,
      userId,
      role: 'member',
    })
    .onConflictDoNothing()
}
