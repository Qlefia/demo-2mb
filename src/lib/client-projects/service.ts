import 'server-only'

import { and, desc, eq } from 'drizzle-orm'
import type { Database } from '@/lib/db/client'
import {
  activities,
  clientProjects,
  deals,
  proposals,
  prospects,
} from '@/lib/db/schema'
import { canTransition, type PipelineRole } from '@/lib/pipeline/transitions'
import {
  rowToClientProjectDto,
  type ClientProjectDTO,
  type ClientProjectOfferSummary,
} from '@/lib/client-projects/schema'

export async function assertProspectExists(
  tx: Database,
  prospectId: string,
): Promise<{ workspaceId: string } | null> {
  const rows = await tx
    .select({ id: prospects.id, workspaceId: prospects.workspaceId })
    .from(prospects)
    .where(eq(prospects.id, prospectId))
    .limit(1)
  if (rows.length === 0) return null
  return { workspaceId: rows[0].workspaceId }
}

async function offersForProject(
  tx: Database,
  projectId: string,
): Promise<ClientProjectOfferSummary[]> {
  const rows = await tx
    .select({
      id: proposals.id,
      title: proposals.title,
      status: proposals.status,
      updatedAt: proposals.updatedAt,
    })
    .from(proposals)
    .where(and(eq(proposals.projectId, projectId), eq(proposals.documentKind, 'offer')))
    .orderBy(desc(proposals.updatedAt))

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    updatedAt:
      row.updatedAt instanceof Date
        ? row.updatedAt.toISOString()
        : new Date(row.updatedAt).toISOString(),
  }))
}

export async function listClientProjectsForProspect(
  tx: Database,
  prospectId: string,
): Promise<ClientProjectDTO[]> {
  const rows = await tx
    .select()
    .from(clientProjects)
    .where(eq(clientProjects.prospectId, prospectId))
    .orderBy(desc(clientProjects.updatedAt))

  const result: ClientProjectDTO[] = []
  for (const row of rows) {
    const offers = await offersForProject(tx, row.id)
    result.push(rowToClientProjectDto(row, offers))
  }
  return result
}

export async function getClientProjectForProspect(
  tx: Database,
  prospectId: string,
  projectId: string,
): Promise<ClientProjectDTO | null> {
  const rows = await tx
    .select()
    .from(clientProjects)
    .where(and(eq(clientProjects.id, projectId), eq(clientProjects.prospectId, prospectId)))
    .limit(1)
  if (rows.length === 0) return null
  const offers = await offersForProject(tx, projectId)
  return rowToClientProjectDto(rows[0], offers)
}

export async function assertProjectBelongsToProspect(
  tx: Database,
  prospectId: string,
  projectId: string,
): Promise<boolean> {
  const rows = await tx
    .select({ id: clientProjects.id })
    .from(clientProjects)
    .where(and(eq(clientProjects.id, projectId), eq(clientProjects.prospectId, prospectId)))
    .limit(1)
  return rows.length > 0
}

export type AcceptOfferResult =
  | { ok: true; project: ClientProjectDTO }
  | { ok: false; error: string }

export async function acceptOfferOnProject(
  tx: Database,
  opts: {
    prospectId: string
    projectId: string
    offerId: string
    actorId: string
    role: PipelineRole
  },
): Promise<AcceptOfferResult> {
  const project = await getClientProjectForProspect(tx, opts.prospectId, opts.projectId)
  if (!project) return { ok: false, error: 'project_not_found' }

  const [offer] = await tx
    .select()
    .from(proposals)
    .where(
      and(
        eq(proposals.id, opts.offerId),
        eq(proposals.prospectId, opts.prospectId),
        eq(proposals.projectId, opts.projectId),
        eq(proposals.documentKind, 'offer'),
      ),
    )
    .limit(1)

  if (!offer) return { ok: false, error: 'offer_not_found' }
  if (offer.status !== 'published') return { ok: false, error: 'offer_not_published' }

  const now = new Date()
  const estimatedValue =
    project.estimatedValue != null ? project.estimatedValue : null

  let dealId = project.dealId
  if (dealId) {
    await tx
      .update(deals)
      .set({
        stage: 'won',
        title: project.title,
        value: estimatedValue,
        currency: project.currency,
        projectId: opts.projectId,
      })
      .where(eq(deals.id, dealId))
  } else {
    const [dealRow] = await tx
      .insert(deals)
      .values({
        prospectId: opts.prospectId,
        projectId: opts.projectId,
        title: project.title,
        value: estimatedValue,
        currency: project.currency,
        stage: 'won',
      })
      .returning({ id: deals.id })
    dealId = dealRow.id
  }

  await tx
    .update(clientProjects)
    .set({
      status: 'in_delivery',
      acceptedOfferId: opts.offerId,
      dealId,
      wonAt: now,
    })
    .where(eq(clientProjects.id, opts.projectId))

  const [prospectRow] = await tx
    .select({ stage: prospects.stage })
    .from(prospects)
    .where(eq(prospects.id, opts.prospectId))
    .limit(1)

  if (prospectRow && prospectRow.stage !== 'won') {
    const transition = canTransition({
      role: opts.role,
      fromStage: prospectRow.stage,
      toStage: 'won',
    })
    if (transition.ok) {
      await tx.update(prospects).set({ stage: 'won' }).where(eq(prospects.id, opts.prospectId))
    }
  }

  await tx.insert(activities).values({
    prospectId: opts.prospectId,
    actorId: opts.actorId,
    type: 'audit',
    payload: {
      action: 'offer_accepted',
      projectId: opts.projectId,
      offerId: opts.offerId,
      dealId,
    },
  })

  const updated = await getClientProjectForProspect(tx, opts.prospectId, opts.projectId)
  if (!updated) return { ok: false, error: 'project_not_found' }
  return { ok: true, project: updated }
}

export async function markProjectOfferSent(
  tx: Database,
  projectId: string,
): Promise<void> {
  const [row] = await tx
    .select({ status: clientProjects.status })
    .from(clientProjects)
    .where(eq(clientProjects.id, projectId))
    .limit(1)
  if (!row) return
  const earlyStatuses = new Set(['discovered', 'qualified'])
  if (earlyStatuses.has(row.status)) {
    await tx
      .update(clientProjects)
      .set({ status: 'offer_sent' })
      .where(eq(clientProjects.id, projectId))
  }
}
