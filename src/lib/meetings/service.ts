import 'server-only'

import { and, asc, eq, gte, inArray, lte, or } from 'drizzle-orm'
import type { Database } from '@/lib/db/client'
import { accounts, meetings, prospects } from '@/lib/db/schema'
import type { MeetingStatus } from '@/lib/db/schema/enums'
import {
  rowToMeetingDto,
  type CalendarMeetingDTO,
  type CalendarScope,
  type MeetingDTO,
} from '@/lib/meetings/schema'

export async function listMeetingsForProspect(
  tx: Database,
  prospectId: string,
): Promise<MeetingDTO[]> {
  const rows = await tx
    .select()
    .from(meetings)
    .where(eq(meetings.prospectId, prospectId))
    .orderBy(asc(meetings.startsAt))
  return rows.map(rowToMeetingDto)
}

export async function assertProspectExists(
  tx: Database,
  prospectId: string,
): Promise<boolean> {
  const rows = await tx
    .select({ id: prospects.id })
    .from(prospects)
    .where(eq(prospects.id, prospectId))
    .limit(1)
  return rows.length > 0
}

interface ListCalendarMeetingsOpts {
  from: Date
  to: Date
  scope: CalendarScope
  currentUserId: string
  assigneeId?: string | null
  prospectId?: string | null
  statuses?: MeetingStatus[]
}

export async function listCalendarMeetings(
  tx: Database,
  opts: ListCalendarMeetingsOpts,
): Promise<CalendarMeetingDTO[]> {
  const conditions = [
    gte(meetings.startsAt, opts.from),
    lte(meetings.startsAt, opts.to),
  ]

  if (opts.prospectId) {
    conditions.push(eq(meetings.prospectId, opts.prospectId))
  }

  if (opts.statuses?.length) {
    conditions.push(inArray(meetings.status, opts.statuses))
  }

  if (opts.scope === 'mine') {
    conditions.push(
      or(
        eq(meetings.assigneeId, opts.currentUserId),
        eq(meetings.organiserId, opts.currentUserId),
      )!,
    )
  } else if (opts.scope === 'team' && opts.assigneeId) {
    conditions.push(
      or(
        eq(meetings.assigneeId, opts.assigneeId),
        eq(meetings.organiserId, opts.assigneeId),
      )!,
    )
  }

  const rows = await tx
    .select({
      meeting: meetings,
      accountName: accounts.name,
      prospectStage: prospects.stage,
    })
    .from(meetings)
    .innerJoin(prospects, eq(meetings.prospectId, prospects.id))
    .innerJoin(accounts, eq(prospects.accountId, accounts.id))
    .where(and(...conditions))
    .orderBy(asc(meetings.startsAt))

  return rows.map(({ meeting, accountName, prospectStage }) => ({
    ...rowToMeetingDto(meeting),
    prospectAccountName: accountName,
    prospectStage,
    assigneeDisplayName: null,
  }))
}
