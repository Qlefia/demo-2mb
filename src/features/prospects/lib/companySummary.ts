import type { ContactDTO } from '@/features/contacts'
import type { Prospect } from '@/features/prospects/types'
import type { DossierSections } from '@/lib/dossiers/schema'

export function formatHqLine(city?: string, country?: string): string | undefined {
  const parts = [city?.trim(), country?.trim()].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : undefined
}

export function resolveWebsite(prospect: Prospect, sections: DossierSections): string | undefined {
  return prospect.account.website?.trim() || sections.snapshot?.websiteOverride?.trim() || undefined
}

export function resolvePrimaryContact(
  contacts: ContactDTO[],
  decisionMakerIds: string[] | undefined,
  primaryContactId?: string | null,
): ContactDTO | undefined {
  if (contacts.length === 0) return undefined
  if (primaryContactId) {
    const explicit = contacts.find((c) => c.id === primaryContactId)
    if (explicit) return explicit
  }
  const ids = decisionMakerIds ?? []
  if (ids.length > 0) {
    const map = new Map(contacts.map((c) => [c.id, c]))
    for (const id of ids) {
      const hit = map.get(id)
      if (hit) return hit
    }
  }
  return contacts[0]
}

export function formatContactLine(contact: ContactDTO): string {
  const role = contact.role?.trim()
  const name = contact.fullName?.trim() ?? ''
  if (role && name) return `${name} · ${role}`
  return name || role || '—'
}

export function isDisplayableContact(contact: ContactDTO | undefined): contact is ContactDTO {
  if (!contact) return false
  return Boolean(contact.fullName?.trim() || contact.role?.trim() || contact.email?.trim())
}
