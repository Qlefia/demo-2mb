import 'server-only'

import type { Prospect } from '@/features/prospects/types'
import { deriveDisplayName, listAllUsers } from '@/lib/team/seatService'

export interface RawProspectRow {
  id: string
  account_id: string
  owner_id: string | null
  created_by: string | null
  source: string
  territory: string
  stage: string
  priority: number
  triage_decision: string | null
  lost_reason: string | null
  suggested_playbook_id: string | null
  primary_contact_id: string | null
  quick_note?: string | null
  created_at: string | Date
  updated_at: string | Date
  account_name: string
  account_website: string | null
  trigger_text: string | null
  trigger_captured_at: string | Date | null
  dossier_status: string | null
}

function toIso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

/**
 * Map a list SQL row to the client `Prospect` shape (without display labels;
 * use {@link withProspectUserLabels} to attach names for owner / creator).
 */
export function rowToProspect(row: RawProspectRow): Prospect {
  return {
    id: row.id,
    accountId: row.account_id,
    account: {
      id: row.account_id,
      name: row.account_name,
      website: row.account_website,
    },
    ownerId: row.owner_id,
    ownerLabel: null,
    createdById: row.created_by,
    createdByLabel: null,
    source: row.source as Prospect['source'],
    territory: row.territory as Prospect['territory'],
    stage: row.stage as Prospect['stage'],
    priority: row.priority,
    triageDecision: row.triage_decision as Prospect['triageDecision'],
    lostReason: row.lost_reason as Prospect['lostReason'],
    suggestedPlaybookId: row.suggested_playbook_id,
    primaryContactId: row.primary_contact_id,
    quickNote: row.quick_note ?? null,
    latestTrigger: row.trigger_text
      ? {
          text: row.trigger_text,
          capturedAt: toIso(row.trigger_captured_at ?? row.created_at),
        }
      : null,
    dossierStatus: (row.dossier_status as Prospect['dossierStatus']) ?? null,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  }
}

function attachUserLabelsOne(p: Prospect, displayById: Record<string, string>): Prospect {
  return {
    ...p,
    ownerLabel: p.ownerId ? (displayById[p.ownerId] ?? null) : null,
    createdByLabel: p.createdById ? (displayById[p.createdById] ?? null) : null,
  }
}

/**
 * Per-process cache for the user → display-name map. Rebuilt at most once per
 * `USER_LABEL_TTL_MS`. Without this, every GET /api/prospects (every dashboard
 * paint, every Realtime invalidation) made a fresh paginated `auth.admin
 * .listUsers` round-trip — historically that cost seconds and on slow links
 * blocked the response for *minutes*, leading to the "page never loads"
 * symptom reported on 2026-05-22.
 *
 * Cache busting: process restart, or any successful mutation that changes a
 * user's display name (covered by Supabase Realtime on `auth.users` if/when
 * we subscribe — for now the TTL is sufficient).
 */
const USER_LABEL_TTL_MS = 60_000
let userLabelCache: { map: Record<string, string>; expiresAt: number } | null = null
let userLabelInFlight: Promise<Record<string, string>> | null = null

export async function buildUserDisplayMap(): Promise<Record<string, string>> {
  const now = Date.now()
  if (userLabelCache && userLabelCache.expiresAt > now) {
    return userLabelCache.map
  }
  if (userLabelInFlight) return userLabelInFlight
  userLabelInFlight = (async () => {
    try {
      const users = await listAllUsers()
      const map: Record<string, string> = {}
      for (const u of users) map[u.id] = deriveDisplayName(u)
      userLabelCache = { map, expiresAt: Date.now() + USER_LABEL_TTL_MS }
      return map
    } finally {
      userLabelInFlight = null
    }
  })()
  return userLabelInFlight
}

/**
 * Stale-while-revalidate. Returns labeled prospects if the cache is warm,
 * otherwise returns unlabeled and kicks off a background refresh so the
 * *next* request gets labels. Never blocks the response on
 * `auth.admin.listUsers`, which has been observed to take 60s+ when the
 * Supabase Admin API is cold or rate-limited — and would otherwise pin
 * GET /api/prospects (and any dashboard paint waiting on it) indefinitely.
 *
 * UI consumers (`Prospect.ownerLabel`, `createdByLabel`) already treat
 * `null` as "not yet known" and fall back to the raw id or "Unassigned".
 */
export async function withProspectUserLabels(items: Prospect[]): Promise<Prospect[]> {
  const cached = userLabelCache
  const now = Date.now()
  if (cached && cached.expiresAt > now) {
    return items.map((p) => attachUserLabelsOne(p, cached.map))
  }
  void buildUserDisplayMap().catch((err) => {
    console.warn('[prospects/serialize] background label refresh failed', err)
  })
  return cached
    ? items.map((p) => attachUserLabelsOne(p, cached.map))
    : items
}

export function withProspectUserLabelsSync(
  items: Prospect[],
  displayById: Record<string, string>,
): Prospect[] {
  return items.map((p) => attachUserLabelsOne(p, displayById))
}
