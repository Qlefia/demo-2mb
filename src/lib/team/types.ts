import type { CrmRole, Territory } from '@/lib/auth/roles'

export type SeatStatus = 'active' | 'invited' | 'deactivated'

export interface Seat {
  id: string
  email: string
  displayName: string
  role: CrmRole | null
  territory: Territory | null
  status: SeatStatus
  lastSignInAt: string | null
  createdAt: string
  invitedAt: string | null
}

export interface AssignableOwner {
  id: string
  displayName: string
  email: string
  role: CrmRole | null
  territory: Territory | null
}
