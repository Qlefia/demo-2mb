import { STUDIO_PRICE_TIER_LIMITS } from '@/features/studio-settings/constants'
import type { StudioCommercialPriceTier } from '@/stores/studioProfileTypes'

export type StudioLegacyCommercialFields = {
  priceFrom?: string
  priceTo?: string
  currency?: string
  priceUnit?: string
  durationNote?: string
}

function newTierId(): string {
  return `pt-${crypto.randomUUID()}`
}

export function createEmptyPriceTier(name = ''): StudioCommercialPriceTier {
  return {
    id: newTierId(),
    name,
    skuPostfix: '',
    description: '',
    revisions: '',
    concepts: '',
    priceAmount: '',
    priceFrom: '',
    priceTo: '',
    freeNote: '',
    durationNote: '',
  }
}

function tierFromLegacy(legacy: StudioLegacyCommercialFields, name: string): StudioCommercialPriceTier {
  const priceFrom = (legacy.priceFrom ?? '').trim()
  const priceTo = (legacy.priceTo ?? '').trim()
  const currency = (legacy.currency ?? '').trim()
  const unit = (legacy.priceUnit ?? '').trim()
  let priceAmount = ''
  if (priceFrom && currency) {
    priceAmount = unit ? `${priceFrom} ${currency} ${unit}` : `${priceFrom} ${currency}`
  } else if (priceFrom) {
    priceAmount = priceFrom
  }

  return {
    id: newTierId(),
    name,
    skuPostfix: '',
    description: '',
    revisions: '',
    concepts: '',
    priceAmount,
    priceFrom,
    priceTo,
    freeNote: '',
    durationNote: (legacy.durationNote ?? '').trim(),
  }
}

function normalizeTier(raw: unknown): StudioCommercialPriceTier | null {
  if (!raw || typeof raw !== 'object') return null
  const x = raw as Partial<StudioCommercialPriceTier>
  if (typeof x.id !== 'string') return null
  return {
    id: x.id,
    name: typeof x.name === 'string' ? x.name.slice(0, STUDIO_PRICE_TIER_LIMITS.name) : '',
    skuPostfix:
      typeof x.skuPostfix === 'string' ? x.skuPostfix.slice(0, STUDIO_PRICE_TIER_LIMITS.skuPostfix) : '',
    description:
      typeof x.description === 'string' ? x.description.slice(0, STUDIO_PRICE_TIER_LIMITS.description) : '',
    revisions:
      typeof x.revisions === 'string' ? x.revisions.slice(0, STUDIO_PRICE_TIER_LIMITS.revisions) : '',
    concepts: typeof x.concepts === 'string' ? x.concepts.slice(0, STUDIO_PRICE_TIER_LIMITS.concepts) : '',
    priceAmount:
      typeof x.priceAmount === 'string' ? x.priceAmount.slice(0, STUDIO_PRICE_TIER_LIMITS.priceAmount) : '',
    priceFrom: typeof x.priceFrom === 'string' ? x.priceFrom.slice(0, STUDIO_PRICE_TIER_LIMITS.priceFrom) : '',
    priceTo: typeof x.priceTo === 'string' ? x.priceTo.slice(0, STUDIO_PRICE_TIER_LIMITS.priceTo) : '',
    freeNote: typeof x.freeNote === 'string' ? x.freeNote.slice(0, STUDIO_PRICE_TIER_LIMITS.freeNote) : '',
    durationNote:
      typeof x.durationNote === 'string' ? x.durationNote.slice(0, STUDIO_PRICE_TIER_LIMITS.durationNote) : '',
  }
}

export function normalizeCommercialPriceTiers(
  raw: unknown,
  legacy?: StudioLegacyCommercialFields,
  defaultTierName = '',
): { priceTiers: StudioCommercialPriceTier[]; activePriceTierId: string } {
  const host = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const rawTiers = Array.isArray(host.priceTiers) ? host.priceTiers : []
  const parsed = rawTiers.map(normalizeTier).filter((t): t is StudioCommercialPriceTier => t !== null)

  let priceTiers = parsed.slice(0, STUDIO_PRICE_TIER_LIMITS.maxTiers)
  if (priceTiers.length === 0) {
    priceTiers = [tierFromLegacy(legacy ?? {}, defaultTierName)]
  }

  const activeRaw = host.activePriceTierId
  const activePriceTierId =
    typeof activeRaw === 'string' && priceTiers.some((t) => t.id === activeRaw)
      ? activeRaw
      : priceTiers[0].id

  return { priceTiers, activePriceTierId }
}

export function getActivePriceTier(
  priceTiers: readonly StudioCommercialPriceTier[],
  activePriceTierId: string | null,
): StudioCommercialPriceTier {
  return priceTiers.find((t) => t.id === activePriceTierId) ?? priceTiers[0] ?? createEmptyPriceTier()
}

/** Display label: Behance-style amount, else from–to range, else single bound. */
export function formatPriceTierAmount(tier: StudioCommercialPriceTier): string {
  const combined = tier.priceAmount.trim()
  if (combined) return combined

  const from = tier.priceFrom.trim()
  const to = tier.priceTo.trim()
  if (from && to) return from === to ? from : `${from} – ${to}`
  if (from) return from
  if (to) return to
  return ''
}

export function formatPriceTierSummary(tier: StudioCommercialPriceTier): string | null {
  const parts: string[] = []
  const sku = tier.skuPostfix.trim()
  if (sku) parts.push(sku)
  const duration = tier.durationNote.trim()
  if (duration) parts.push(duration)
  const amount = formatPriceTierAmount(tier)
  if (amount) parts.push(amount)
  const rev = tier.revisions.trim()
  if (rev) parts.push(`rev ${rev}`)
  const con = tier.concepts.trim()
  if (con) parts.push(`con ${con}`)
  return parts.length > 0 ? parts.join(' · ') : null
}
