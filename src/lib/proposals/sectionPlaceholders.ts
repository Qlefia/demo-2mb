import type { StudioBankAccount } from '@/stores/studioProfileTypes'

export type SectionPlaceholderContext = Record<string, string>

function str(raw: unknown, max = 500): string {
  if (typeof raw !== 'string') return ''
  return raw.trim().slice(0, max)
}

function parseBankAccounts(raw: unknown): StudioBankAccount[] {
  if (!raw || typeof raw !== 'object') return []
  const list = (raw as { bankAccounts?: unknown }).bankAccounts
  return Array.isArray(list) ? (list as StudioBankAccount[]) : []
}

function pickBankAccount(
  accounts: StudioBankAccount[],
  bankAccountId: string | null | undefined,
): StudioBankAccount | null {
  if (bankAccountId) {
    const hit = accounts.find((a) => a.id === bankAccountId)
    if (hit) return hit
  }
  return accounts.find((a) => a.isDefault) ?? accounts[0] ?? null
}

/** Flat `{{bank.iban}}` / `{{studio.signingName}}` map from Studio general + template bank pick. */
export function buildSectionPlaceholderContext(
  studioGeneral: unknown,
  bankAccountId?: string | null,
): SectionPlaceholderContext {
  if (!studioGeneral || typeof studioGeneral !== 'object') return {}
  const g = studioGeneral as Record<string, unknown>
  const bank = pickBankAccount(parseBankAccounts(g), bankAccountId)

  const ctx: SectionPlaceholderContext = {
    'studio.signingName': str(g.signingName),
    'studio.signingRole': str(g.signingRole),
    'studio.signingEmail': str(g.signingEmail),
    'studio.signingPhone': str(g.signingPhone),
    'studio.tradingName': str(g.tradingName) || str(g.headline),
    'studio.legalEntityName': str(g.legalEntityName),
  }

  if (bank) {
    ctx['bank.holderName'] = bank.holderName.trim()
    ctx['bank.iban'] = bank.iban.trim()
    ctx['bank.bic'] = bank.bic.trim()
    ctx['bank.bankName'] = bank.bankName.trim()
    ctx['bank.currency'] = bank.currency.trim()
  }

  return ctx
}

const PLACEHOLDER_RE = /\{\{([a-zA-Z0-9_.]+)\}\}/g

export function substituteSectionPlaceholders(
  body: string,
  ctx: SectionPlaceholderContext,
): string {
  return body.replace(PLACEHOLDER_RE, (full, key: string) => {
    const val = ctx[key]
    return val !== undefined && val !== '' ? val : full
  })
}
