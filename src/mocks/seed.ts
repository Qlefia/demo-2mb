import { MOCK_USER_ID } from '@/mocks/ids'

export interface MockUserRow {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
  avatarType: 'photo' | 'emoji' | 'initials' | 'icon'
  avatarEmoji: string | null
  avatarIcon: string | null
  avatarBg: string | null
  language: 'en' | 'de' | 'ru'
  timezone: string
}

export interface MockNotificationRow {
  id: string
  type: string
  title: string
  message?: string
  surveyId?: string
  leadId?: string
  read: boolean
  createdAt: string
}

export interface MockConsentLogRow {
  id: string
  category: string
  granted: boolean
  changedAt: string
}

export interface MockStateShape {
  user: MockUserRow
  notifications: MockNotificationRow[]
  consentLog: MockConsentLogRow[]
}

export const initialMockState: MockStateShape = {
  user: {
    id: MOCK_USER_ID,
    email: 'ops@2mb.studio',
    displayName: 'Ops',
    avatarUrl: null,
    avatarType: 'initials',
    avatarEmoji: null,
    avatarIcon: null,
    avatarBg: null,
    language: 'en',
    timezone: 'Europe/Berlin',
  },
  notifications: [],
  consentLog: [],
}
