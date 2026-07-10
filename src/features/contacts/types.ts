import type { ContactDTO } from '@/lib/contacts/schema'

export type { ContactDTO }

export interface ContactFormValues {
  fullName: string
  role: string
  email: string
  phone: string
  linkedinUrl: string
  optedOut: boolean
}

export const EMPTY_FORM: ContactFormValues = {
  fullName: '',
  role: '',
  email: '',
  phone: '',
  linkedinUrl: '',
  optedOut: false,
}
