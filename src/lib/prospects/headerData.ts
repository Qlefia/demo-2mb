import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { ContactDTO } from '@/features/contacts/types'
import type { Prospect } from '@/features/prospects/types'
import type { TaskDTO } from '@/lib/tasks/schema'
import { postgrestContactToDto } from '@/lib/contacts/service'
import { loadProspectForUser } from '@/lib/prospects/serverData'

export interface ProspectNextMeeting {
  id: string
  title: string
  startsAt: string
}

export interface ProspectNextTouch {
  kind: 'meeting' | 'task'
  id: string
  title: string
  at: string | null
}

export interface ProspectNextTask {
  id: string
  title: string
  dueAt: string | null
}

export interface ProspectOpenDeal {
  total: number
  currency: string
  count: number
}

export interface ProspectLastActivity {
  id: string
  type: string
  createdAt: string
  summary: string | null
}

export interface ProspectHeaderDTO {
  prospect: Prospect
  primaryContact: ContactDTO | null
  nextMeeting: ProspectNextMeeting | null
  nextTask: ProspectNextTask | null
  nextTouch: ProspectNextTouch | null
  openDeal: ProspectOpenDeal | null
  lastActivity: ProspectLastActivity | null
}

interface DealRow {
  id: string
  value: string | null
  currency: string
  stage: string
}

const OPEN_TASK_STATUSES = new Set(['open', 'in_progress'])

function pickNextMeeting(rows: { id: string; title: string; starts_at: string; status: string }[]): ProspectNextMeeting | null {
  const now = Date.now()
  const upcoming = rows
    .filter((r) => r.status === 'scheduled' && new Date(r.starts_at).getTime() >= now - 30 * 60 * 1000)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  const next = upcoming[0]
  if (!next) return null
  return { id: next.id, title: next.title, startsAt: next.starts_at }
}

export function pickNextTouch(
  meeting: ProspectNextMeeting | null,
  task: ProspectNextTask | null,
): ProspectNextTouch | null {
  if (!meeting && !task) return null
  if (!meeting) return { kind: 'task', id: task!.id, title: task!.title, at: task!.dueAt }
  if (!task || !task.dueAt) {
    return { kind: 'meeting', id: meeting.id, title: meeting.title, at: meeting.startsAt }
  }
  const meetingMs = new Date(meeting.startsAt).getTime()
  const taskMs = new Date(task.dueAt).getTime()
  if (meetingMs <= taskMs) {
    return { kind: 'meeting', id: meeting.id, title: meeting.title, at: meeting.startsAt }
  }
  return { kind: 'task', id: task.id, title: task.title, at: task.dueAt }
}

function pickNextTask(tasks: TaskDTO[]): ProspectNextTask | null {
  const open = tasks.filter((task) => OPEN_TASK_STATUSES.has(task.status))
  if (open.length === 0) return null
  open.sort((a, b) => {
    if (a.dueAt && b.dueAt) return a.dueAt.localeCompare(b.dueAt)
    if (a.dueAt) return -1
    if (b.dueAt) return 1
    return a.createdAt.localeCompare(b.createdAt)
  })
  const next = open[0]
  return { id: next.id, title: next.title, dueAt: next.dueAt }
}

function summariseOpenDeals(deals: DealRow[]): ProspectOpenDeal | null {
  const open = deals.filter((deal) => deal.stage === 'open')
  if (open.length === 0) return null
  const currency = open[0].currency
  const total = open.reduce((sum, deal) => {
    if (deal.currency !== currency || deal.value == null) return sum
    const amount = Number.parseFloat(deal.value)
    return Number.isFinite(amount) ? sum + amount : sum
  }, 0)
  return { total, currency, count: open.length }
}

function activitySummary(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const summary = (payload as { summary?: unknown }).summary
  return typeof summary === 'string' ? summary : null
}

export async function loadProspectHeaderForUser(
  supabase: SupabaseClient,
  prospectId: string,
): Promise<ProspectHeaderDTO | null> {
  const prospect = await loadProspectForUser(supabase, prospectId)
  if (!prospect) return null

  const [tasksRes, dealsRes, activityRes, primaryRes, meetingsRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, due_at, status, created_at')
      .eq('prospect_id', prospectId),
    supabase
      .from('deals')
      .select('id, value, currency, stage')
      .eq('prospect_id', prospectId),
    supabase
      .from('activities')
      .select('id, type, payload, created_at')
      .eq('prospect_id', prospectId)
      .order('created_at', { ascending: false })
      .limit(1),
    prospect.primaryContactId
      ? supabase
          .from('contacts')
          .select('*')
          .eq('id', prospect.primaryContactId)
          .eq('account_id', prospect.accountId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from('meetings')
      .select('id, title, starts_at, status')
      .eq('prospect_id', prospectId)
      .eq('status', 'scheduled')
      .order('starts_at', { ascending: true }),
  ])

  const tasks: TaskDTO[] = (tasksRes.data ?? []).map((row) => ({
    id: row.id as string,
    prospectId,
    title: row.title as string,
    status: row.status as TaskDTO['status'],
    dueAt: (row.due_at as string | null) ?? null,
    assigneeId: '',
    playbookId: null,
    createdAt: row.created_at as string,
    completedAt: null,
  }))

  const deals = (dealsRes.data ?? []) as DealRow[]
  const activityRow = activityRes.data?.[0] ?? null
  const nextMeeting = pickNextMeeting((meetingsRes.data ?? []) as { id: string; title: string; starts_at: string; status: string }[])
  const nextTask = pickNextTask(tasks)

  let primaryContact: ContactDTO | null = null
  if (primaryRes.data && !primaryRes.error) {
    primaryContact = postgrestContactToDto(primaryRes.data as never)
  }

  return {
    prospect,
    primaryContact,
    nextMeeting,
    nextTask,
    nextTouch: pickNextTouch(nextMeeting, nextTask),
    openDeal: summariseOpenDeals(deals),
    lastActivity: activityRow
      ? {
          id: activityRow.id as string,
          type: activityRow.type as string,
          createdAt: activityRow.created_at as string,
          summary: activitySummary(activityRow.payload),
        }
      : null,
  }
}
