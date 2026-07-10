import 'server-only'

import { randomBytes } from 'node:crypto'
import { and, eq, ne } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import {
  organizationProfile,
  workspaceMembers,
  workspaceOnboardingState,
  workspaces,
} from '@/lib/db/schema'
import { DEFAULT_WORKSPACE_ID } from '@/lib/workspace/constants'
import { selectPrimaryWorkspaceIdForUser } from '@/lib/workspace/resolvePrimaryWorkspaceId'
import { slugifyStudioName } from '@/lib/workspace/slugifyStudioName'

export interface ProvisionStudioWorkspaceResult {
  workspaceId: string
  slug: string
  created: boolean
  skipped?: boolean
}

export interface ProvisionStudioWorkspaceOptions {
  /** When true, only creates a workspace if the user has no workspace rows yet (first-login safety net). */
  onlyIfNoWorkspace?: boolean
}

/**
 * Creates a dedicated workspace for a studio tenant (privileged `db` — bypasses RLS).
 * Idempotent: if the user already owns a non-default workspace, returns it without creating.
 */
export async function provisionStudioWorkspace(
  userId: string,
  studioName: string,
  options?: ProvisionStudioWorkspaceOptions,
): Promise<ProvisionStudioWorkspaceResult> {
  const name = studioName.trim() || 'My studio'

  const [existingOwned] = await db
    .select({ workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(
      and(
        eq(workspaceMembers.userId, userId),
        eq(workspaceMembers.role, 'owner'),
        ne(workspaceMembers.workspaceId, DEFAULT_WORKSPACE_ID),
      ),
    )
    .limit(1)

  if (existingOwned) {
    const [ws] = await db
      .select({ slug: workspaces.slug })
      .from(workspaces)
      .where(eq(workspaces.id, existingOwned.workspaceId))
      .limit(1)
    return {
      workspaceId: existingOwned.workspaceId,
      slug: ws?.slug ?? 'unknown',
      created: false,
    }
  }

  if (options?.onlyIfNoWorkspace) {
    const [anyMembership] = await db
      .select({ workspaceId: workspaceMembers.workspaceId })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, userId))
      .limit(1)
    if (anyMembership) {
      const workspaceId = await selectPrimaryWorkspaceIdForUser(db, userId)
      const [ws] = await db.select({ slug: workspaces.slug }).from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1)
      return {
        workspaceId,
        slug: ws?.slug ?? 'unknown',
        created: false,
        skipped: true,
      }
    }
  }

  const baseSlug = slugifyStudioName(name)
  let slug = baseSlug
  let created = false
  let workspaceId = ''

  await db.transaction(async (tx) => {
    for (let attempt = 0; attempt < 12; attempt++) {
      const [collision] = await tx.select({ id: workspaces.id }).from(workspaces).where(eq(workspaces.slug, slug)).limit(1)
      if (!collision) break
      slug = `${baseSlug}-${randomBytes(3).toString('hex')}`.slice(0, 60)
    }

    const [ws] = await tx
      .insert(workspaces)
      .values({ name, slug })
      .returning({ id: workspaces.id })
    if (!ws) throw new Error('workspace_insert_failed')
    workspaceId = ws.id

    await tx.insert(workspaceMembers).values({
      workspaceId,
      userId,
      role: 'owner',
    })

    await tx.insert(workspaceOnboardingState).values({
      workspaceId,
      status: 'draft',
    })

    await tx.insert(organizationProfile).values({
      workspaceId,
      legalName: name,
      addressLine: '—',
      registerLine: null,
    })

    created = true
  })

  return { workspaceId, slug, created }
}
