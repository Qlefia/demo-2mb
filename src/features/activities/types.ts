import type { ActivityDTO } from '@/lib/activities/schema'
import type { UserActivityType } from '@/lib/activities/schema'

export type { ActivityDTO, UserActivityType }

export interface ActivityComposerValues {
  type: UserActivityType
  summary: string
  durationMinutes?: number
  subject?: string
  url?: string
  /** Optional link for dedupe — same type + contact within 24h returns 409 */
  contactId?: string
}
