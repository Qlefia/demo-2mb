import { proposals } from '@/lib/db/schema'

export function proposalRowToJson(row: typeof proposals.$inferSelect) {
  const c = row.createdAt as unknown as Date | string
  const u = row.updatedAt as unknown as Date | string
  const issued = row.issuedAt as unknown as Date | string | null
  return {
    id: row.id,
    prospectId: row.prospectId,
    documentKind: row.documentKind,
    title: row.title,
    blocks: row.blocks,
    language: row.language,
    version: row.version,
    status: row.status,
    publishedVersionId: row.publishedVersionId,
    metadata: row.metadata ?? {},
    issuedAt:
      issued instanceof Date
        ? issued.toISOString()
        : issued
          ? new Date(issued).toISOString()
          : null,
    validityDays: row.validityDays,
    projectName: row.projectName,
    projectId: row.projectId,
    createdAt: c instanceof Date ? c.toISOString() : new Date(c).toISOString(),
    updatedAt: u instanceof Date ? u.toISOString() : new Date(u).toISOString(),
  }
}
