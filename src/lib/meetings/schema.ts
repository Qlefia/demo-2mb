import { z } from 'zod'
import { MEETING_STATUSES, type MeetingStatus } from '@/lib/db/schema/enums'

export type { MeetingStatus }

export const CALENDAR_SCOPES = ['mine', 'team', 'all'] as const
export type CalendarScope = (typeof CALENDAR_SCOPES)[number]

export const CALENDAR_VIEWS = ['week', 'month'] as const
export type CalendarView = (typeof CALENDAR_VIEWS)[number]

export const createMeetingSchema = z
  .object({
    title: z.string().min(1).max(200),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime().nullable().optional(),
    location: z.string().max(500).nullable().optional(),
    contactId: z.string().uuid().nullable().optional(),
    notes: z.string().max(5000).nullable().optional(),
    assigneeId: z.string().uuid().optional(),
  })
  .strict()
  .refine(
    (v) => {
      if (!v.endsAt) return true
      return new Date(v.endsAt).getTime() > new Date(v.startsAt).getTime()
    },
    { message: 'ends_before_start', path: ['endsAt'] },
  )

export const updateMeetingSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    startsAt: z.string().datetime().optional(),
    endsAt: z.string().datetime().nullable().optional(),
    location: z.string().max(500).nullable().optional(),
    contactId: z.string().uuid().nullable().optional(),
    notes: z.string().max(5000).nullable().optional(),
    status: z.enum(MEETING_STATUSES).optional(),
    assigneeId: z.string().uuid().optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'no_fields' })

export interface MeetingDTO {
  id: string
  prospectId: string
  contactId: string | null
  organiserId: string
  assigneeId: string
  title: string
  startsAt: string
  endsAt: string | null
  location: string | null
  status: MeetingStatus
  notes: string | null
  externalSource: string | null
  externalId: string | null
  createdAt: string
  updatedAt: string
}

export interface CalendarMeetingDTO extends MeetingDTO {
  prospectAccountName: string
  prospectStage: string
  assigneeDisplayName: string | null
}

export function rowToMeetingDto(row: {
  id: string
  prospectId: string
  contactId: string | null
  organiserId: string
  assigneeId: string
  title: string
  startsAt: Date | string
  endsAt: Date | string | null
  location: string | null
  status: MeetingStatus
  notes: string | null
  externalSource: string | null
  externalId: string | null
  createdAt: Date | string
  updatedAt: Date | string
}): MeetingDTO {
  const iso = (v: Date | string) => (v instanceof Date ? v.toISOString() : new Date(v).toISOString())
  return {
    id: row.id,
    prospectId: row.prospectId,
    contactId: row.contactId,
    organiserId: row.organiserId,
    assigneeId: row.assigneeId,
    title: row.title,
    startsAt: iso(row.startsAt),
    endsAt: row.endsAt != null ? iso(row.endsAt) : null,
    location: row.location,
    status: row.status,
    notes: row.notes,
    externalSource: row.externalSource,
    externalId: row.externalId,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  }
}
