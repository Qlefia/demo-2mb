import 'server-only'

import { and, asc, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import {
  workspaceClientSegments,
  workspaceOfferMatrix,
  workspaceOnboardingState,
  workspaceMembers,
  workspaceServices,
} from '@/lib/db/schema'
import { selectPrimaryWorkspaceIdForUser } from '@/lib/workspace/resolvePrimaryWorkspaceId'

export type OnboardingPayload = {
  workspaceId: string
  state: typeof workspaceOnboardingState.$inferSelect | undefined
  services: (typeof workspaceServices.$inferSelect)[]
  segments: (typeof workspaceClientSegments.$inferSelect)[]
  matrix: (typeof workspaceOfferMatrix.$inferSelect)[]
}

/**
 * Loads studio onboarding data using the privileged pool connection.
 * RLS is enforced in application code: workspace must list the user in `workspace_members`.
 *
 * This avoids `SET LOCAL ROLE authenticated` inside a transaction pooler transaction, which
 * can fail or behave inconsistently with Supabase pooler + Drizzle while still returning 500s.
 */
export async function loadOnboardingPayloadForUser(userId: string): Promise<OnboardingPayload | null> {
  const workspaceId = await selectPrimaryWorkspaceIdForUser(db, userId)

  const [membership] = await db
    .select({ workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.userId, userId), eq(workspaceMembers.workspaceId, workspaceId)))
    .limit(1)

  if (!membership) {
    return null
  }

  await db
    .insert(workspaceOnboardingState)
    .values({ workspaceId, status: 'draft' })
    .onConflictDoNothing()

  const [state] = await db
    .select()
    .from(workspaceOnboardingState)
    .where(eq(workspaceOnboardingState.workspaceId, workspaceId))
    .limit(1)

  const services = await db
    .select()
    .from(workspaceServices)
    .where(eq(workspaceServices.workspaceId, workspaceId))
    .orderBy(asc(workspaceServices.sortOrder), asc(workspaceServices.title))

  const segments = await db
    .select()
    .from(workspaceClientSegments)
    .where(eq(workspaceClientSegments.workspaceId, workspaceId))
    .orderBy(desc(workspaceClientSegments.priority), asc(workspaceClientSegments.title))

  const matrix = await db
    .select()
    .from(workspaceOfferMatrix)
    .where(eq(workspaceOfferMatrix.workspaceId, workspaceId))

  return { workspaceId, state, services, segments, matrix }
}

export async function assertUserWorkspaceAccess(userId: string, workspaceId: string): Promise<boolean> {
  const [row] = await db
    .select({ workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.userId, userId), eq(workspaceMembers.workspaceId, workspaceId)))
    .limit(1)
  return Boolean(row)
}
