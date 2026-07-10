import 'server-only'

import { eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { workspaceStudioSettings } from '@/lib/db/schema'
import { getServiceClient } from '@/lib/supabase/service'
import {
  emptyStudioSalesSnapshot,
  isStudioSalesSnapshot,
  type StudioProfileSnapshot,
  type StudioSalesSnapshot,
} from '@/lib/studio/studioProfileSnapshot'
import {
  migrateStudioProfileSnapshotImages,
  snapshotContainsDataImages,
} from '@/lib/workspace/migrateStudioProfileImages'
import { assertUserWorkspaceAccess } from '@/lib/workspace/workspaceOnboardingData'
import { selectPrimaryWorkspaceIdForUser } from '@/lib/workspace/resolvePrimaryWorkspaceId'
import {
  normalizeBankAccounts,
  normalizeDocumentSections,
  normalizeDocumentTemplates,
  normalizeInvoiceNumbering,
  normalizeOfferNumbering,
  normalizePaymentDefaults,
  normalizeTaxProfile,
} from '@/lib/studio/normalizeBillingGeneral'
import { withDbRetry } from '@/lib/db/withDbRetry'

const loadInflight = new Map<string, Promise<WorkspaceStudioSettingsRow | null>>()

export type WorkspaceStudioSettingsRow = {
  workspaceId: string
  revision: number
  general: unknown
  sales: StudioSalesSnapshot
  updatedAt: string
}

/**
 * Normalize the billing-related slice of `general` jsonb in place: bank accounts get exactly
 * one default, IBANs are uppercased, tax profile enums are coerced, numbering counters clamped,
 * templates lose any sectionIds that no longer exist. Other `general` fields are passed through.
 *
 * Runs on both load and save so old rows self-heal and bad writes from a future broken client
 * cannot corrupt the document tree on the server.
 */
function normalizeBillingGeneralSlice(general: unknown): Record<string, unknown> {
  const base = (general && typeof general === 'object' ? (general as Record<string, unknown>) : {})
  const displayCurrency =
    typeof base.displayCurrency === 'string' && base.displayCurrency.length > 0
      ? base.displayCurrency
      : 'EUR'
  const sections = normalizeDocumentSections(base.documentSections)
  const knownSectionIds = new Set(sections.map((s) => s.id))
  return {
    ...base,
    bankAccounts: normalizeBankAccounts(base.bankAccounts, displayCurrency),
    taxProfile: normalizeTaxProfile(base.taxProfile),
    invoiceNumbering: normalizeInvoiceNumbering(base.invoiceNumbering),
    offerNumbering: normalizeOfferNumbering(base.offerNumbering),
    paymentDefaults: normalizePaymentDefaults(base.paymentDefaults),
    documentSections: sections,
    documentTemplates: normalizeDocumentTemplates(base.documentTemplates, knownSectionIds),
  }
}

export async function loadWorkspaceStudioSettingsForUser(
  userId: string,
): Promise<WorkspaceStudioSettingsRow | null> {
  const pending = loadInflight.get(userId)
  if (pending) return pending

  const promise = loadWorkspaceStudioSettingsForUserInner(userId).finally(() => {
    loadInflight.delete(userId)
  })
  loadInflight.set(userId, promise)
  return promise
}

async function loadWorkspaceStudioSettingsForUserInner(
  userId: string,
): Promise<WorkspaceStudioSettingsRow | null> {
  const workspaceId = await withDbRetry(() => selectPrimaryWorkspaceIdForUser(db, userId))
  const allowed = await assertUserWorkspaceAccess(userId, workspaceId)
  if (!allowed) return null

  await withDbRetry(() =>
    db.insert(workspaceStudioSettings).values({ workspaceId }).onConflictDoNothing(),
  )

  const [row] = await withDbRetry(() =>
    db
      .select()
      .from(workspaceStudioSettings)
      .where(eq(workspaceStudioSettings.workspaceId, workspaceId))
      .limit(1),
  )

  if (!row) return null

  let general: unknown = normalizeBillingGeneralSlice(row.general)
  const salesRaw = row.sales
  let sales = isStudioSalesSnapshot(salesRaw) ? salesRaw : emptyStudioSalesSnapshot()
  // Legacy rows persisted before `tools`/`products` existed — backfill empty
  // arrays so the rest of the pipeline (snapshot guard, client store, Realtime
  // diffs) sees a complete sales shape.
  sales = {
    ...sales,
    tools: Array.isArray(sales.tools) ? sales.tools : [],
    products: Array.isArray(sales.products) ? sales.products : [],
  }
  let revision = row.revision

  const snapshot: StudioProfileSnapshot = {
    general: general as StudioProfileSnapshot['general'],
    sales,
  }

  if (snapshotContainsDataImages(snapshot)) {
    try {
      const supabase = getServiceClient()
      const migrated = await migrateStudioProfileSnapshotImages(snapshot, workspaceId, supabase)
      let saved = await withDbRetry(() =>
        saveWorkspaceStudioSettings({
          userId,
          snapshot: migrated,
          expectedRevision: revision,
          force: true,
        }),
      )
      if (!saved.ok && saved.reason === 'conflict') {
        saved = await withDbRetry(() =>
          saveWorkspaceStudioSettings({ userId, snapshot: migrated, force: true }),
        )
      }
      if (saved.ok) {
        general = migrated.general
        sales = migrated.sales
        revision = saved.revision
      }
    } catch (err) {
      console.warn('[workspace-studio-settings] inline image migration skipped', err)
    }
  }

  return {
    workspaceId: row.workspaceId,
    revision,
    general,
    sales,
    updatedAt: row.updatedAt.toISOString(),
  }
}

export type SaveWorkspaceStudioSettingsInput = {
  userId: string
  snapshot: StudioProfileSnapshot
  expectedRevision?: number
  /**
   * Allow an UPDATE that would empty a previously non-empty protected array
   * (offices, services, segments, works, reviews, documentTemplates, etc.).
   * Default `false`. Set explicitly from a deliberate UI "delete all" action.
   * The auto-push subscriber NEVER sets this — protects against client bugs
   * where a freshly-hydrated empty Zustand store overwrites the server.
   */
  force?: boolean
}

/**
 * Protected `general.*` array fields. A row in `existing` that has a non-empty
 * array here will reject a save whose payload contains an empty array, unless
 * the caller passes `force: true`. See `SaveWorkspaceStudioSettingsInput.force`.
 */
const PROTECTED_GENERAL_ARRAY_KEYS = [
  'studioOffices',
  'studioBrands',
  'documentTemplates',
  'documentSections',
  'bankAccounts',
] as const satisfies readonly string[]

const PROTECTED_SALES_ARRAY_KEYS = [
  'serviceCatalog',
  'serviceGroups',
  'segments',
  'works',
  'reviews',
  'tools',
  'products',
] as const satisfies readonly (keyof StudioSalesSnapshot)[]

function arrayLength(value: unknown): number {
  return Array.isArray(value) ? value.length : 0
}

function findNonemptyOverwriteField(
  existingGeneral: unknown,
  existingSales: StudioSalesSnapshot,
  incoming: StudioProfileSnapshot,
): string | null {
  const eg =
    existingGeneral && typeof existingGeneral === 'object'
      ? (existingGeneral as Record<string, unknown>)
      : {}
  const ig = incoming.general as unknown as Record<string, unknown>
  for (const key of PROTECTED_GENERAL_ARRAY_KEYS) {
    if (arrayLength(eg[key]) > 0 && arrayLength(ig[key]) === 0) {
      return `general.${key}`
    }
  }
  for (const key of PROTECTED_SALES_ARRAY_KEYS) {
    if (arrayLength(existingSales[key]) > 0 && arrayLength(incoming.sales[key]) === 0) {
      return `sales.${key}`
    }
  }
  return null
}

export type SaveWorkspaceStudioSettingsResult =
  | { ok: true; workspaceId: string; revision: number }
  | { ok: false; reason: 'forbidden' | 'conflict'; revision?: number }
  | { ok: false; reason: 'nonempty_overwrite'; field: string; revision: number }

export async function saveWorkspaceStudioSettings(
  input: SaveWorkspaceStudioSettingsInput,
): Promise<SaveWorkspaceStudioSettingsResult> {
  const workspaceId = await selectPrimaryWorkspaceIdForUser(db, input.userId)
  const allowed = await assertUserWorkspaceAccess(input.userId, workspaceId)
  if (!allowed) return { ok: false, reason: 'forbidden' }

  const [existing] = await db
    .select({
      revision: workspaceStudioSettings.revision,
      general: workspaceStudioSettings.general,
      sales: workspaceStudioSettings.sales,
    })
    .from(workspaceStudioSettings)
    .where(eq(workspaceStudioSettings.workspaceId, workspaceId))
    .limit(1)

  if (
    input.expectedRevision !== undefined &&
    existing &&
    existing.revision !== input.expectedRevision
  ) {
    return { ok: false, reason: 'conflict', revision: existing.revision }
  }

  if (existing && !input.force) {
    const existingSales = isStudioSalesSnapshot(existing.sales)
      ? existing.sales
      : emptyStudioSalesSnapshot()
    const offending = findNonemptyOverwriteField(existing.general, existingSales, input.snapshot)
    if (offending) {
      console.warn(
        '[workspace-studio-settings] blocked nonempty_overwrite',
        JSON.stringify({
          workspaceId,
          userId: input.userId,
          field: offending,
          revision: existing.revision,
        }),
      )
      return {
        ok: false,
        reason: 'nonempty_overwrite',
        field: offending,
        revision: existing.revision,
      }
    }
  }

  const supabase = getServiceClient()
  const migrated = snapshotContainsDataImages(input.snapshot)
    ? await migrateStudioProfileSnapshotImages(input.snapshot, workspaceId, supabase)
    : input.snapshot
  const snapshot: StudioProfileSnapshot = {
    general: normalizeBillingGeneralSlice(migrated.general) as StudioProfileSnapshot['general'],
    sales: {
      ...migrated.sales,
      tools: Array.isArray(migrated.sales.tools) ? migrated.sales.tools : [],
      products: Array.isArray(migrated.sales.products) ? migrated.sales.products : [],
    },
  }

  const [row] = await db
    .insert(workspaceStudioSettings)
    .values({
      workspaceId,
      general: snapshot.general,
      sales: snapshot.sales,
      updatedBy: input.userId,
      revision: 1,
    })
    .onConflictDoUpdate({
      target: workspaceStudioSettings.workspaceId,
      set: {
        general: snapshot.general,
        sales: snapshot.sales,
        updatedBy: input.userId,
        revision: sql`${workspaceStudioSettings.revision} + 1`,
        updatedAt: sql`now()`,
      },
    })
    .returning({
      revision: workspaceStudioSettings.revision,
      workspaceId: workspaceStudioSettings.workspaceId,
    })

  return { ok: true, workspaceId: row.workspaceId, revision: row.revision }
}
