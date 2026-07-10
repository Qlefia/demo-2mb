import { z } from 'zod'
import { ACTIVITY_TYPES, type ActivityType } from '@/lib/db/schema/enums'

export const USER_ACTIVITY_TYPES = ['note', 'call', 'email', 'linkedin'] as const
export type UserActivityType = (typeof USER_ACTIVITY_TYPES)[number]

export const SYSTEM_ACTIVITY_TYPES = ACTIVITY_TYPES.filter(
  (t): t is Exclude<ActivityType, UserActivityType> =>
    !(USER_ACTIVITY_TYPES as readonly string[]).includes(t),
)

export function isUserActivityType(t: string): t is UserActivityType {
  return (USER_ACTIVITY_TYPES as readonly string[]).includes(t)
}

/**
 * `note` is a user activity type, but founder/ops also use it to audit some
 * system events (e.g. dossier reopened). Such rows carry `payload.system === true`
 * and must NOT be editable/deletable through the public activities CRUD.
 */
export function isSystemActivityRow(
  type: string,
  payload: Record<string, unknown> | null | undefined,
): boolean {
  if (!isUserActivityType(type)) return true
  return payload != null && payload.system === true
}

const callPayloadSchema = z
  .object({
    durationMinutes: z.number().int().min(1).max(600).optional(),
    summary: z.string().min(1).max(2000).optional(),
    contactId: z.string().uuid().optional(),
  })
  .strict()

const emailPayloadSchema = z
  .object({
    subject: z.string().min(1).max(300).optional(),
    summary: z.string().min(1).max(2000).optional(),
    contactId: z.string().uuid().optional(),
  })
  .strict()

const linkedinPayloadSchema = z
  .object({
    url: z.string().url().max(500).optional(),
    summary: z.string().min(1).max(2000).optional(),
    contactId: z.string().uuid().optional(),
  })
  .strict()

const notePayloadSchema = z
  .object({
    summary: z.string().min(1).max(2000),
    contactId: z.string().uuid().optional(),
  })
  .strict()

export const createActivitySchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('note'), payload: notePayloadSchema }).strict(),
  z.object({ type: z.literal('call'), payload: callPayloadSchema }).strict(),
  z.object({ type: z.literal('email'), payload: emailPayloadSchema }).strict(),
  z.object({ type: z.literal('linkedin'), payload: linkedinPayloadSchema }).strict(),
])

export const updateActivitySchema = z.union([
  z.object({ type: z.literal('note'), payload: notePayloadSchema }).strict(),
  z.object({ type: z.literal('call'), payload: callPayloadSchema }).strict(),
  z.object({ type: z.literal('email'), payload: emailPayloadSchema }).strict(),
  z.object({ type: z.literal('linkedin'), payload: linkedinPayloadSchema }).strict(),
])

export type CreateActivityInput = z.infer<typeof createActivitySchema>
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>

export interface ActivityDTO {
  id: string
  prospectId: string
  actorId: string | null
  type: ActivityType
  payload: Record<string, unknown>
  createdAt: string
  isSystem: boolean
}
