'use client'

import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { IconButton, Input, TextArea } from '@/components/atoms'
import { StudioFieldHeader } from '@/features/studio-settings/components/StudioFieldHeader'
import { STUDIO_PRICE_TIER_LIMITS } from '@/features/studio-settings/constants'
import { createEmptyPriceTier } from '@/features/studio-settings/lib/studioPriceTiers'
import {
  studioAccentAddButtonBlock,
  studioEditorPanel,
  studioWorkspaceBody,
} from '@/features/studio-settings/studioBlockChrome'
import type { StudioCommercialPriceTier } from '@/stores/studioProfileTypes'
import { cn } from '@/lib/cn'

type StudioPriceTiersEditorProps = {
  priceTiers: StudioCommercialPriceTier[]
  activePriceTierId: string | null
  onChange: (patch: {
    priceTiers?: StudioCommercialPriceTier[]
    activePriceTierId?: string | null
  }) => void
  idPrefix?: string
  defaultTierName?: string
}

type StudioPriceTierCardProps = {
  tier: StudioCommercialPriceTier
  idPrefix: string
  displayName: string
  canRemove: boolean
  onPatch: (patch: Partial<StudioCommercialPriceTier>) => void
  onRemove: () => void
}

function StudioPriceTierCard({
  tier,
  idPrefix,
  displayName,
  canRemove,
  onPatch,
  onRemove,
}: StudioPriceTierCardProps) {
  const { t } = useTranslation()
  const pf = `${idPrefix}-${tier.id}`

  return (
    <section className={cn(studioEditorPanel, 'flex-none')} aria-label={displayName}>
      <div className="mb-3 flex items-center justify-between gap-2 border-b border-border/50 pb-2">
        <span className="min-w-0 truncate text-xs font-semibold text-foreground">{displayName}</span>
        {canRemove ? (
          <IconButton
            icon={Trash2}
            size="xs"
            variant="destructive"
            className="shrink-0"
            label={t('studioSettings.services.pricingTier.remove')}
            onClick={onRemove}
          />
        ) : null}
      </div>

      <div className={studioWorkspaceBody}>
        <div className="studio-field-stack">
          <StudioFieldHeader
            htmlFor={`${pf}-tier-name`}
            label={t('studioSettings.services.pricingTier.name')}
            showAi={false}
          />
          <Input
            id={`${pf}-tier-name`}
            value={tier.name}
            onChange={(e) => onPatch({ name: e.target.value })}
            maxLength={STUDIO_PRICE_TIER_LIMITS.name}
            placeholder={t('studioSettings.services.pricingTier.namePlaceholder')}
          />
        </div>

        <div className="studio-field-stack">
          <StudioFieldHeader
            htmlFor={`${pf}-sku`}
            label={t('studioSettings.services.pricingTier.skuPostfix')}
            showAi={false}
          />
          <Input
            id={`${pf}-sku`}
            value={tier.skuPostfix}
            onChange={(e) => onPatch({ skuPostfix: e.target.value })}
            maxLength={STUDIO_PRICE_TIER_LIMITS.skuPostfix}
            placeholder={t('studioSettings.services.pricingTier.skuPostfixPlaceholder')}
          />
        </div>

        <div className="studio-field-stack">
          <StudioFieldHeader
            htmlFor={`${pf}-desc`}
            label={t('studioSettings.services.pricingTier.description')}
            hint={t('studioSettings.services.pricingTier.descriptionHint')}
            showAi={false}
          />
          <TextArea
            id={`${pf}-desc`}
            rows={6}
            value={tier.description}
            onChange={(e) => onPatch({ description: e.target.value })}
            maxLength={STUDIO_PRICE_TIER_LIMITS.description}
            placeholder={t('studioSettings.services.pricingTier.descriptionPlaceholder')}
          />
        </div>

        <div className="grid gap-[var(--studio-stack-block-gap)] sm:grid-cols-2">
          <div className="studio-field-stack">
            <StudioFieldHeader
              htmlFor={`${pf}-rev`}
              label={t('studioSettings.services.pricingTier.revisions')}
              showAi={false}
            />
            <Input
              id={`${pf}-rev`}
              value={tier.revisions}
              onChange={(e) => onPatch({ revisions: e.target.value })}
              maxLength={STUDIO_PRICE_TIER_LIMITS.revisions}
              placeholder={t('studioSettings.services.pricingTier.optionalPlaceholder')}
            />
          </div>
          <div className="studio-field-stack">
            <StudioFieldHeader
              htmlFor={`${pf}-con`}
              label={t('studioSettings.services.pricingTier.concepts')}
              showAi={false}
            />
            <Input
              id={`${pf}-con`}
              value={tier.concepts}
              onChange={(e) => onPatch({ concepts: e.target.value })}
              maxLength={STUDIO_PRICE_TIER_LIMITS.concepts}
              placeholder={t('studioSettings.services.pricingTier.optionalPlaceholder')}
            />
          </div>
        </div>

        <div className="studio-field-stack">
          <StudioFieldHeader
            htmlFor={`${pf}-amount`}
            label={t('studioSettings.services.pricingTier.priceAmount')}
            hint={t('studioSettings.services.pricingTier.priceAmountHint')}
            showAi={false}
          />
          <Input
            id={`${pf}-amount`}
            value={tier.priceAmount}
            onChange={(e) => onPatch({ priceAmount: e.target.value })}
            maxLength={STUDIO_PRICE_TIER_LIMITS.priceAmount}
            placeholder={t('studioSettings.services.pricingTier.priceAmountPlaceholder')}
          />
        </div>

        <div className="grid gap-[var(--studio-stack-block-gap)] sm:grid-cols-2">
          <div className="studio-field-stack">
            <StudioFieldHeader
              htmlFor={`${pf}-from`}
              label={t('studioSettings.services.pricingTier.priceFrom')}
              showAi={false}
            />
            <Input
              id={`${pf}-from`}
              value={tier.priceFrom}
              onChange={(e) => onPatch({ priceFrom: e.target.value })}
              maxLength={STUDIO_PRICE_TIER_LIMITS.priceFrom}
              placeholder={t('studioSettings.services.pricingTier.priceFromPlaceholder')}
              inputMode="decimal"
            />
          </div>
          <div className="studio-field-stack">
            <StudioFieldHeader
              htmlFor={`${pf}-to`}
              label={t('studioSettings.services.pricingTier.priceTo')}
              showAi={false}
            />
            <Input
              id={`${pf}-to`}
              value={tier.priceTo}
              onChange={(e) => onPatch({ priceTo: e.target.value })}
              maxLength={STUDIO_PRICE_TIER_LIMITS.priceTo}
              placeholder={t('studioSettings.services.pricingTier.priceToPlaceholder')}
              inputMode="decimal"
            />
          </div>
        </div>

        <div className="studio-field-stack">
          <StudioFieldHeader
            htmlFor={`${pf}-duration`}
            label={t('studioSettings.services.pricingTier.duration')}
            hint={t('studioSettings.services.pricingTier.durationHint')}
            showAi={false}
          />
          <Input
            id={`${pf}-duration`}
            value={tier.durationNote}
            onChange={(e) => onPatch({ durationNote: e.target.value })}
            maxLength={STUDIO_PRICE_TIER_LIMITS.durationNote}
            placeholder={t('studioSettings.services.pricingTier.durationPlaceholder')}
          />
        </div>

        <div className="studio-field-stack">
          <StudioFieldHeader
            htmlFor={`${pf}-free`}
            label={t('studioSettings.services.pricingTier.freeNote')}
            showAi={false}
          />
          <TextArea
            id={`${pf}-free`}
            rows={3}
            value={tier.freeNote}
            onChange={(e) => onPatch({ freeNote: e.target.value })}
            maxLength={STUDIO_PRICE_TIER_LIMITS.freeNote}
            placeholder={t('studioSettings.services.pricingTier.freeNotePlaceholder')}
          />
        </div>
      </div>
    </section>
  )
}

export function StudioPriceTiersEditor({
  priceTiers,
  activePriceTierId,
  onChange,
  idPrefix = 'pricing',
  defaultTierName = '',
}: StudioPriceTiersEditorProps) {
  const { t } = useTranslation()

  const patchTier = useCallback(
    (tierId: string, patch: Partial<StudioCommercialPriceTier>) => {
      onChange({
        priceTiers: priceTiers.map((tier) => (tier.id === tierId ? { ...tier, ...patch } : tier)),
      })
    },
    [onChange, priceTiers],
  )

  const addTier = () => {
    if (priceTiers.length >= STUDIO_PRICE_TIER_LIMITS.maxTiers) return
    const tier = createEmptyPriceTier(
      t('studioSettings.services.pricingTier.defaultName', { index: priceTiers.length + 1 }),
    )
    onChange({ priceTiers: [...priceTiers, tier], activePriceTierId: tier.id })
  }

  const removeTier = (tierId: string) => {
    if (priceTiers.length <= 1) return
    const next = priceTiers.filter((tier) => tier.id !== tierId)
    const nextActive =
      activePriceTierId === tierId
        ? (next[0]?.id ?? null)
        : (next.find((tier) => tier.id === activePriceTierId)?.id ?? next[0]?.id ?? null)
    onChange({ priceTiers: next, activePriceTierId: nextActive })
  }

  if (priceTiers.length === 0) return null

  const tierLabel = (tier: StudioCommercialPriceTier, index: number) =>
    tier.name.trim() ||
    defaultTierName ||
    t('studioSettings.services.pricingTier.defaultName', { index: index + 1 })

  const canAddTier = priceTiers.length < STUDIO_PRICE_TIER_LIMITS.maxTiers
  const canRemoveTier = priceTiers.length > 1

  return (
    <div className="flex flex-col gap-3">
      {priceTiers.map((tier, index) => (
        <StudioPriceTierCard
          key={tier.id}
          tier={tier}
          idPrefix={idPrefix}
          displayName={tierLabel(tier, index)}
          canRemove={canRemoveTier}
          onPatch={(patch) => patchTier(tier.id, patch)}
          onRemove={() => removeTier(tier.id)}
        />
      ))}

      {canAddTier ? (
        <button type="button" onClick={addTier} className={studioAccentAddButtonBlock}>
          <Plus size={16} aria-hidden />
          {t('studioSettings.services.pricingTier.addNew')}
        </button>
      ) : null}
    </div>
  )
}
