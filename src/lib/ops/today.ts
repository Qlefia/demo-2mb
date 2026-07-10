import { eq, sql } from 'drizzle-orm'
import type { Database } from '@/lib/db/client'
import { providerQuota } from '@/lib/db/schema'
import { OPS_KPI_TIMEZONE_IANA, OPS_KPI_WINDOW_DAYS, OPS_QUEUE_LIMIT } from './constants'

export interface OpsProspectSummary {
  id: string
  accountId: string
  accountName: string
  territory: string
  stage: string
  dossierStatus: string | null
  triggerPreview: string | null
  triggerCapturedAt: string | null
  createdAt: string
}

export interface OpsTodayKpis {
  dossiersReadyToday: number
  avgHoursToReadyRolling: number | null
  optOutRatePercent: number | null
}

export interface ProviderQuotaDisplay {
  provider: string
  used: number
  /** Display ceiling when known (NewsAPI free tier default 100, etc.) */
  limit: number | null
}

interface RawSummaryRow {
  id: string
  account_id: string
  account_name: string
  territory: string
  stage: string
  dossier_status: string | null
  trigger_text: string | null
  trigger_captured_at: string | null
  created_at: string
}

/** Drizzle + postgres-js may return a plain array or `{ rows }` depending on version. */
function asRowArray<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[]
  if (
    result !== null &&
    typeof result === 'object' &&
    'rows' in result &&
    Array.isArray((result as { rows: unknown }).rows)
  ) {
    return (result as { rows: T[] }).rows
  }
  return []
}

function toIso(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) {
    return new Date(0).toISOString()
  }
  return d.toISOString()
}

function mapRow(row: RawSummaryRow): OpsProspectSummary {
  return {
    id: row.id,
    accountId: row.account_id,
    accountName: row.account_name,
    territory: row.territory,
    stage: row.stage,
    dossierStatus: row.dossier_status,
    triggerPreview: row.trigger_text,
    triggerCapturedAt: row.trigger_captured_at ? toIso(row.trigger_captured_at) : null,
    createdAt: toIso(row.created_at),
  }
}

function utcTodayDate(): Date {
  const n = new Date()
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate()))
}

const QUOTA_DISPLAY_ORDER = ['apollo', 'browse_ai', 'newsapi', 'wayback'] as const

export async function fetchProviderQuotaDisplays(tx: Database): Promise<ProviderQuotaDisplay[]> {
  const newsDefaultLimit = process.env.NEWSAPI_DAILY_LIMIT
    ? Number(process.env.NEWSAPI_DAILY_LIMIT)
    : 100
  const apolloDefaultLimit = process.env.APOLLO_DAILY_LIMIT
    ? Number(process.env.APOLLO_DAILY_LIMIT)
    : null

  const bucket = utcTodayDate()
  let rows: { provider: string; used: number; limitCap: number | null }[] = []
  try {
    rows = await tx
      .select({
        provider: providerQuota.provider,
        used: providerQuota.used,
        limitCap: providerQuota.limitCap,
      })
      .from(providerQuota)
      .where(eq(providerQuota.bucketDate, bucket))
  } catch {
    // Table missing or RLS / connection issue — keep dashboard usable (BACKLOG: verify migrations).
    rows = []
  }

  const map = new Map(rows.map((r) => [r.provider, r]))
  return QUOTA_DISPLAY_ORDER.map((provider) => {
    const row = map.get(provider)
    let limit: number | null = row?.limitCap ?? null
    if (limit == null && provider === 'newsapi') {
      limit = newsDefaultLimit
    }
    if (limit == null && provider === 'apollo') {
      limit = apolloDefaultLimit
    }
    return {
      provider,
      used: row?.used ?? 0,
      limit,
    }
  })
}

const kpiWindow = sql.raw(`interval '${OPS_KPI_WINDOW_DAYS} days'`)

export async function fetchTriageQueue(tx: Database): Promise<OpsProspectSummary[]> {
  const result = await tx.execute(sql`
    select
      p.id,
      p.account_id,
      a.name as account_name,
      p.territory::text as territory,
      p.stage::text as stage,
      d.status::text as dossier_status,
      t.text as trigger_text,
      t.captured_at as trigger_captured_at,
      p.created_at
    from prospects p
    join accounts a on a.id = p.account_id
    left join dossiers d on d.prospect_id = p.id
    left join lateral (
      select
        coalesce(
          tr.payload ->> 'text',
          tr.payload ->> 'summary',
          tr.type
        ) as text,
        tr.occurred_at as captured_at
      from triggers tr
      where tr.account_id = p.account_id
      order by tr.occurred_at desc
      limit 1
    ) t on true
    where p.stage = 'new'
    order by p.created_at desc
    limit ${OPS_QUEUE_LIMIT}
  `)
  const rows = asRowArray<RawSummaryRow>(result)
  return rows.map(mapRow)
}

export async function fetchDossierReviewQueue(tx: Database): Promise<OpsProspectSummary[]> {
  const result = await tx.execute(sql`
    select
      p.id,
      p.account_id,
      a.name as account_name,
      p.territory::text as territory,
      p.stage::text as stage,
      d.status::text as dossier_status,
      t.text as trigger_text,
      t.captured_at as trigger_captured_at,
      p.created_at
    from prospects p
    join accounts a on a.id = p.account_id
    left join dossiers d on d.prospect_id = p.id
    left join lateral (
      select
        coalesce(
          tr.payload ->> 'text',
          tr.payload ->> 'summary',
          tr.type
        ) as text,
        tr.occurred_at as captured_at
      from triggers tr
      where tr.account_id = p.account_id
      order by tr.occurred_at desc
      limit 1
    ) t on true
    where d.status in ('draft', 'in_review')
      and p.stage in ('enriching', 'dossier_in_progress')
    order by p.updated_at desc
    limit ${OPS_QUEUE_LIMIT}
  `)
  const rows = asRowArray<RawSummaryRow>(result)
  return rows.map(mapRow)
}

export async function fetchOpsKpis(tx: Database): Promise<OpsTodayKpis> {
  const tz = OPS_KPI_TIMEZONE_IANA

  const readyToday = await tx.execute(sql`
    select count(*)::int as c
    from activities a
    where a.type = 'dossier_delivered'
      and (a.created_at at time zone ${tz})::date = (now() at time zone ${tz})::date
  `)
  const readyRows = asRowArray<{ c: number | string }>(readyToday)
  const dossiersReadyToday = Number(readyRows[0]?.c ?? 0)

  const avgRes = await tx.execute(sql`
    select
      avg(
        extract(epoch from (del.created_at - p.created_at)) / 3600.0
      )::float8 as avg_hours
    from activities del
    join prospects p on p.id = del.prospect_id
    where del.type = 'dossier_delivered'
      and del.created_at >= now() - ${kpiWindow}
  `)
  const avgRows = asRowArray<{ avg_hours: number | null }>(avgRes)
  const avgHours = avgRows[0]?.avg_hours
  const avgHoursToReadyRolling =
    avgHours != null && !Number.isNaN(avgHours) ? Math.round(avgHours * 10) / 10 : null

  const rateRes = await tx.execute(sql`
    with del as (
      select count(*)::numeric as c
      from activities
      where type = 'dossier_delivered'
        and created_at >= now() - ${kpiWindow}
    ),
    opt as (
      select count(*)::numeric as c
      from activities
      where type = 'opt_out'
        and created_at >= now() - ${kpiWindow}
    )
    select
      case
        when del.c > 0 then round(100.0 * opt.c / del.c, 1)::float8
        else null
      end as pct
    from del, opt
  `)
  const rateRows = asRowArray<{ pct: number | null }>(rateRes)
  const optOutRatePercent = rateRows[0]?.pct ?? null

  return {
    dossiersReadyToday,
    avgHoursToReadyRolling,
    optOutRatePercent,
  }
}

export interface OpsTodaySnapshot {
  triage: OpsProspectSummary[]
  dossierReview: OpsProspectSummary[]
  kpis: OpsTodayKpis
  providerQuotas: ProviderQuotaDisplay[]
}

export async function loadOpsTodaySnapshot(tx: Database): Promise<OpsTodaySnapshot> {
  // Sequential: postgres-js uses a single connection per transaction; parallel
  // `execute` calls on the same client can fail with "Cannot use a pool after calling end".
  const triage = await fetchTriageQueue(tx)
  const dossierReview = await fetchDossierReviewQueue(tx)
  const kpis = await fetchOpsKpis(tx)
  const providerQuotas = await fetchProviderQuotaDisplays(tx)
  return { triage, dossierReview, kpis, providerQuotas }
}
