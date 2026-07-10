import 'server-only'

import { eq, sql } from 'drizzle-orm'
import type { Database } from '@/lib/db/client'
import { dossiers, dossierVersions, prospects } from '@/lib/db/schema'
import type { DossierStatus } from '@/lib/db/schema/enums'
import { computeSectionsDiff } from './diff'
import { dossierSectionsSchema, EMPTY_SECTIONS, type DossierSections } from './schema'

export interface DossierRecord {
  id: string
  prospectId: string
  status: DossierStatus
  version: number
  sections: DossierSections
  aiMetadata: Record<string, unknown> | null
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
}

function toIso(value: Date | string | null): string | null {
  if (!value) return null
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function rowToRecord(row: typeof dossiers.$inferSelect): DossierRecord {
  const parsed = dossierSectionsSchema.safeParse(row.sections)
  const meta = row.aiMetadata
  return {
    id: row.id,
    prospectId: row.prospectId,
    status: row.status,
    version: row.version,
    sections: parsed.success ? parsed.data : ({} as DossierSections),
    aiMetadata:
      meta && typeof meta === 'object' && !Array.isArray(meta)
        ? (meta as Record<string, unknown>)
        : null,
    reviewedBy: row.reviewedBy,
    reviewedAt: toIso(row.reviewedAt),
    createdAt: toIso(row.createdAt) ?? '',
    updatedAt: toIso(row.updatedAt) ?? '',
  }
}

export async function loadDossierByProspect(
  tx: Database,
  prospectId: string,
): Promise<DossierRecord | null> {
  const rows = await tx
    .select()
    .from(dossiers)
    .where(eq(dossiers.prospectId, prospectId))
    .limit(1)
  return rows[0] ? rowToRecord(rows[0]) : null
}

export async function ensureProspectExists(
  tx: Database,
  prospectId: string,
): Promise<{ exists: true } | { exists: false }> {
  const rows = await tx
    .select({ id: prospects.id })
    .from(prospects)
    .where(eq(prospects.id, prospectId))
    .limit(1)
  return rows[0] ? { exists: true } : { exists: false }
}

export interface SaveDossierResult {
  dossier: DossierRecord
  versionWritten: boolean
  versionNumber: number
  changedKeys: string[]
}

/**
 * Upsert sections for a prospect. If no dossier exists yet, creates one with
 * status='draft' and version=1. On every subsequent save with at least one
 * changed section key, bumps `version` and writes a `dossier_versions` row
 * containing only the diff (changed sections before/after).
 *
 * Idempotent for no-op writes — same content twice = one version, no audit row.
 */
export async function saveDossierSections(
  tx: Database,
  prospectId: string,
  nextSections: DossierSections,
  actorId: string | null,
  options?: { aiMetadata?: Record<string, unknown> | null },
): Promise<SaveDossierResult> {
  const existing = await loadDossierByProspect(tx, prospectId)

  if (!existing) {
    const insertRow = await tx
      .insert(dossiers)
      .values({
        prospectId,
        status: 'draft',
        version: 1,
        sections: nextSections as unknown as Record<string, unknown>,
        ...(options?.aiMetadata !== undefined
          ? { aiMetadata: options.aiMetadata as Record<string, unknown> }
          : {}),
      })
      .returning()
    const created = rowToRecord(insertRow[0])

    const diff = computeSectionsDiff(EMPTY_SECTIONS, nextSections)
    await tx.insert(dossierVersions).values({
      dossierId: created.id,
      version: 1,
      sectionsDiff: diff as unknown as Record<string, unknown>,
      generatedBy: actorId,
    })

    return {
      dossier: created,
      versionWritten: true,
      versionNumber: 1,
      changedKeys: diff.changedKeys,
    }
  }

  const diff = computeSectionsDiff(existing.sections, nextSections)
  if (diff.changedKeys.length === 0) {
    return {
      dossier: existing,
      versionWritten: false,
      versionNumber: existing.version,
      changedKeys: [],
    }
  }

  const nextVersion = existing.version + 1
  const updated = await tx
    .update(dossiers)
    .set({
      sections: nextSections as unknown as Record<string, unknown>,
      version: nextVersion,
      updatedAt: sql`now()`,
      ...(options?.aiMetadata !== undefined
        ? { aiMetadata: options.aiMetadata as Record<string, unknown> }
        : {}),
    })
    .where(eq(dossiers.id, existing.id))
    .returning()

  await tx.insert(dossierVersions).values({
    dossierId: existing.id,
    version: nextVersion,
    sectionsDiff: diff as unknown as Record<string, unknown>,
    generatedBy: actorId,
  })

  return {
    dossier: rowToRecord(updated[0]),
    versionWritten: true,
    versionNumber: nextVersion,
    changedKeys: diff.changedKeys,
  }
}

export async function setDossierStatus(
  tx: Database,
  dossierId: string,
  patch: {
    status: DossierStatus
    reviewedBy: string | null
    reviewedAt: Date | null
  },
): Promise<DossierRecord | null> {
  const rows = await tx
    .update(dossiers)
    .set({
      status: patch.status,
      reviewedBy: patch.reviewedBy,
      reviewedAt: patch.reviewedAt,
      updatedAt: sql`now()`,
    })
    .where(eq(dossiers.id, dossierId))
    .returning()
  return rows[0] ? rowToRecord(rows[0]) : null
}
